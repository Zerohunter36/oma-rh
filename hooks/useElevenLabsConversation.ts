"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage } from "../components/ChatPanel";
import { decodeBase64ToPCM16, downsampleTo16kPCM16, encodePCM16ToBase64 } from "../lib/audio/downsample";
import { computeRms } from "../lib/audio/rms";
import { PCMPlayer } from "../lib/audio/pcm-player";

type ConversationStatus = "idle" | "connecting" | "connected" | "error";

interface ElevenLabsMessageBase {
  type?: string;
  [key: string]: unknown;
}

interface UseElevenLabsConversationResult {
  messages: ChatMessage[];
  status: ConversationStatus;
  error: string | null;
  isMicrophoneActive: boolean;
  mouthOpenAmount: number;
  startConversation: () => void;
  stopConversation: () => void;
  sendTextMessage: (text: string) => void;
}

const CLOSE_EVENTS = [
  WebSocket.CLOSING,
  WebSocket.CLOSED,
];

export interface UseElevenLabsConversationOptions {
  onAgentAudioFrame?: (frame: Float32Array) => void;
  onConversationStarted?: () => void;
  onConversationStopped?: () => void;
}

export function useElevenLabsConversation(
  options?: UseElevenLabsConversationOptions,
): UseElevenLabsConversationResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [mouthOpenAmount, setMouthOpenAmount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playerRef = useRef<PCMPlayer | null>(null);
  const rmsDecayRef = useRef<number>(0);
  const silentGainRef = useRef<GainNode | null>(null);

  const agentUrl = useMemo(() => process.env.NEXT_PUBLIC_AGENT_WS_URL ?? "", []);
  const agentId = useMemo(() => process.env.NEXT_PUBLIC_AGENT_ID ?? "", []);

  const onAgentAudioFrameRef = useRef<((frame: Float32Array) => void) | undefined>(
    options?.onAgentAudioFrame,
  );
  const onConversationStartedRef = useRef<(() => void) | undefined>(options?.onConversationStarted);
  const onConversationStoppedRef = useRef<(() => void) | undefined>(options?.onConversationStopped);

  useEffect(() => {
    onAgentAudioFrameRef.current = options?.onAgentAudioFrame;
  }, [options?.onAgentAudioFrame]);

  useEffect(() => {
    onConversationStartedRef.current = options?.onConversationStarted;
  }, [options?.onConversationStarted]);

  useEffect(() => {
    onConversationStoppedRef.current = options?.onConversationStopped;
  }, [options?.onConversationStopped]);

  const resetAudioPipeline = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    processorRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    if (silentGainRef.current) {
      silentGainRef.current.disconnect();
      silentGainRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    playerRef.current?.stop();
    playerRef.current = null;
    setIsMicrophoneActive(false);
  }, []);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleAudioFrame = useCallback((frame: Float32Array) => {
    onAgentAudioFrameRef.current?.(frame);
    const rms = computeRms(frame);
    const momentum = 0.2;
    const previous = rmsDecayRef.current;
    const smoothed = momentum * rms + (1 - momentum) * previous;
    rmsDecayRef.current = smoothed;
    setMouthOpenAmount(Math.min(1, smoothed * 6));
  }, []);

  const stopConversation = useCallback(() => {
    setStatus((current) => (current === "idle" ? current : "idle"));
    wsRef.current?.close();
    wsRef.current = null;
    resetAudioPipeline();
    onConversationStoppedRef.current?.();
  }, [resetAudioPipeline]);

  const sendTextMessage = useCallback(
    (text: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        appendMessage({
          role: "agent",
          text: "No hay conexión activa. Inicia una conversación antes de enviar mensajes.",
        });
        return;
      }

      const payload = {
        type: "user_input_text",
        text,
      };

      ws.send(JSON.stringify(payload));
      appendMessage({ role: "user", text });
    },
    [appendMessage],
  );

  const handleIncomingMessage = useCallback(
    (event: MessageEvent) => {
      try {
        if (event.data instanceof ArrayBuffer) {
          const samples = new Int16Array(event.data);
          playerRef.current?.enqueue(samples, 16000);
          return;
        }

        if (event.data instanceof Blob) {
          event.data.arrayBuffer().then((buffer) => {
            const samples = new Int16Array(buffer);
            playerRef.current?.enqueue(samples, 16000);
          });
          return;
        }

        if (typeof event.data === "string") {
          const parsed: ElevenLabsMessageBase = JSON.parse(event.data);

          switch (parsed.type) {
            case "conversation_initiation_response": {
              const message =
                (parsed.conversation_initiation_response as { agent_response?: string })?.agent_response ??
                "¡Conexión lista!";
              appendMessage({ role: "agent", text: message });
              break;
            }
            case "agent_response": {
              const agentText =
                (parsed.agent_response as { response?: string; text?: string; transcript?: string })?.response ||
                (parsed.agent_response as { text?: string })?.text ||
                (parsed.agent_response as { transcript?: string })?.transcript;
              if (agentText) {
                appendMessage({ role: "agent", text: agentText });
              }
              break;
            }
            case "user_transcript": {
              const transcript =
                (parsed.user_transcript as { transcript?: string })?.transcript ??
                (parsed.user_transcript as { text?: string })?.text;
              if (transcript) {
                appendMessage({ role: "user", text: transcript });
              }
              break;
            }
            case "audio": {
              const audioPayload = parsed.audio_event as { audio_base_64?: string; audio_base64?: string };
              const base64 = audioPayload?.audio_base_64 ?? audioPayload?.audio_base64;
              if (base64) {
                const samples = decodeBase64ToPCM16(base64);
                playerRef.current?.enqueue(samples, 16000);
              }
              break;
            }
            case "ping": {
              const pingEvent = parsed.ping_event as { event_id?: string };
              if (pingEvent?.event_id && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    type: "pong",
                    event_id: pingEvent.event_id,
                  }),
                );
              }
              break;
            }
            default: {
              if ((parsed as { audio_base_64?: string }).audio_base_64) {
                const samples = decodeBase64ToPCM16((parsed as { audio_base_64: string }).audio_base_64);
                playerRef.current?.enqueue(samples, 16000);
              }
              break;
            }
          }
        }
      } catch (incomingError) {
        console.error("Error al procesar mensaje de ElevenLabs", incomingError);
      }
    },
    [appendMessage],
  );

  const prepareAudioPipeline = useCallback(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioContext = new AudioContext();
    await audioContext.resume();
    const source = audioContext.createMediaStreamSource(mediaStream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (event) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const [inputChannel] = [event.inputBuffer.getChannelData(0)];
      const downsampled = downsampleTo16kPCM16(inputChannel, audioContext.sampleRate);
      const base64 = encodePCM16ToBase64(downsampled);

      const message = {
        type: "user_audio_chunk",
        audio_event: {
          audio_base_64: base64,
        },
      };

      try {
        ws.send(JSON.stringify(message));
      } catch (streamError) {
        console.error("No se pudo enviar chunk de audio", streamError);
      }
    };

    source.connect(processor);

    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);
    silentGainRef.current = silentGain;

    audioContextRef.current = audioContext;
    mediaStreamRef.current = mediaStream;
    processorRef.current = processor;

    const player = new PCMPlayer(audioContext, handleAudioFrame);
    playerRef.current = player;
    setIsMicrophoneActive(true);
  }, [handleAudioFrame]);

  const startConversation = useCallback(() => {
    if (!agentUrl) {
      setError(
        "Configura NEXT_PUBLIC_AGENT_WS_URL con la URL de tu proxy WebSocket hacia ElevenLabs Agents.",
      );
      return;
    }

    if (wsRef.current && !CLOSE_EVENTS.includes(wsRef.current.readyState)) {
      return;
    }

    setStatus("connecting");
    setError(null);

    const url = new URL(agentUrl, typeof window !== "undefined" ? window.location.href : undefined);
    if (agentId && !url.searchParams.get("agent_id")) {
      url.searchParams.set("agent_id", agentId);
    }

    const ws = new WebSocket(url.toString(), ["realtime", "v1"]);

    wsRef.current = ws;

    ws.addEventListener("open", async () => {
      setStatus("connected");
      appendMessage({ role: "agent", text: "Conexión establecida. Estoy escuchando." });
      onConversationStartedRef.current?.();

      const initPayload = {
        type: "conversation_initiation_client_data",
        conversation_config_override: {
          agent: agentId ? { agent_id: agentId } : undefined,
          tts: {
            // Puedes ajustar voice_id o parámetros de idioma desde aquí.
          },
        },
      };
      ws.send(JSON.stringify(initPayload));

      try {
        await prepareAudioPipeline();
      } catch (audioError) {
        setError("No se pudo acceder al micrófono. Verifica los permisos del navegador.");
        console.error(audioError);
      }
    });

    ws.addEventListener("message", handleIncomingMessage);

    ws.addEventListener("error", (event) => {
      console.error("WebSocket error", event);
      setStatus("error");
      setError("Ocurrió un error con la conexión a ElevenLabs. Revisa la consola para más detalles.");
    });

    ws.addEventListener("close", () => {
      appendMessage({ role: "agent", text: "La conversación se ha cerrado." });
      setStatus("idle");
      resetAudioPipeline();
      onConversationStoppedRef.current?.();
    });
  }, [agentId, agentUrl, appendMessage, handleIncomingMessage, prepareAudioPipeline, resetAudioPipeline]);

  useEffect(() => () => {
    stopConversation();
  }, [stopConversation]);

  useEffect(() => {
    if (status !== "connected") {
      setMouthOpenAmount((current) => current * 0.8);
    }
  }, [status]);

  return {
    messages,
    status,
    error,
    isMicrophoneActive,
    mouthOpenAmount,
    startConversation,
    stopConversation,
    sendTextMessage,
  };
}
