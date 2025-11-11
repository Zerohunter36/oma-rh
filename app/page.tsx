"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ChatPanel, { ChatMessage } from "../components/ChatPanel";

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const startConversation = useCallback(() => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // TODO: Reemplaza la URL con el endpoint oficial de ElevenLabs Agents.
    // TODO: Si empleas el SDK más reciente de ElevenLabs, inicialízalo aquí y utiliza su helper para obtener la URL del agente.
    const ws = new WebSocket("wss://example-elevenlabs-endpoint");

    ws.onopen = () => {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Conexión establecida. ¡Listo para conversar!" },
      ]);

      // TODO: Envía aquí la petición inicial o mensaje de arranque hacia el agente de ElevenLabs.
    };

    ws.onmessage = (event) => {
      // TODO: Procesa la estructura real que responde ElevenLabs (JSON, binario, etc.).
      const incomingText = typeof event.data === "string" ? event.data : "[Respuesta binaria recibida]";

      setMessages((prev) => [...prev, { role: "agent", text: incomingText }]);

      // TODO: Utiliza aquí los métodos de TalkingHead para reproducir audio:
      // talkingHeadInstance.streamStart(...)
      // talkingHeadInstance.streamAudio(...)
      // talkingHeadInstance.streamNotifyEnd(...)
      // talkingHeadInstance.streamStop()
    };

    ws.onerror = () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "Ocurrió un error con la conexión del WebSocket.",
        },
      ]);
    };

    ws.onclose = () => {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "La conversación se ha cerrado." },
      ]);
      setSocket(null);
    };

    setSocket(ws);
  }, [socket]);

  const stopConversation = useCallback(() => {
    if (!socket) {
      return;
    }

    // TODO: Antes de cerrar la conexión, envía cualquier mensaje final requerido por ElevenLabs.
    socket.close();
  }, [socket]);

  useEffect(() => {
    return () => {
      socket?.close();
    };
  }, [socket]);

  useEffect(() => {
    let talkingHeadInstance: unknown;

    const mountTalkingHead = async () => {
      const container = document.getElementById("avatar-container");
      if (!container) {
        return;
      }

      // TODO: Reemplaza este import dinámico con la ruta correcta a tu módulo TalkingHead.
      // const { TalkingHead } = await import("../modules/talkinghead.mjs");
      // talkingHeadInstance = new TalkingHead({ canvas: container });
      // TODO: Configura aquí cualquier inicialización necesaria para TalkingHead.
    };

    mountTalkingHead();

    return () => {
      // TODO: Realiza aquí la limpieza de la instancia de TalkingHead si la librería lo requiere.
      if (talkingHeadInstance && typeof (talkingHeadInstance as { destroy?: () => void }).destroy === "function") {
        (talkingHeadInstance as { destroy: () => void }).destroy();
      }
    };
  }, []);

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) {
        return;
      }

      const outgoingMessage: ChatMessage = { role: "user", text };
      setMessages((prev) => [...prev, outgoingMessage]);

      if (socket && socket.readyState === WebSocket.OPEN) {
        // TODO: Ajusta la estructura de payload según lo que requiera ElevenLabs Agents.
        socket.send(JSON.stringify({ type: "user_input", text }));
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            text: "No hay una conexión activa. Inicia una conversación antes de enviar mensajes.",
          },
        ]);
      }

      // TODO: Si necesitas enviar audio en lugar de texto, captura el stream y envíalo aquí.
    },
    [socket]
  );

  const actionButtons = useMemo(
    () => (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={startConversation}
          className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          Iniciar conversación
        </button>
        <button
          onClick={stopConversation}
          className="flex-1 rounded-lg bg-rose-500 px-4 py-2 font-semibold text-white shadow hover:bg-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
        >
          Detener conversación
        </button>
      </div>
    ),
    [startConversation, stopConversation]
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row">
        <section className="flex-1 space-y-6">
          <header className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Talking Head + ElevenLabs Demo
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300 md:text-base">
              Interfaz base para experimentar con la integración de ElevenLabs Agents y un avatar 3D impulsado por
              TalkingHead. Completa los TODO marcados en el código para conectar tus servicios reales.
            </p>
          </header>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold">Avatar en vivo</h2>
            <div
              id="avatar-container"
              className="aspect-video w-full overflow-hidden rounded-xl border border-white/5 bg-black/60"
            >
              {/* TODO: TalkingHead renderizará aquí el avatar 3D. */}
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Este contenedor se conectará con la instancia de <code>TalkingHead</code> para mostrar animaciones sincronizadas con
              las respuestas de audio del agente.
            </p>
          </div>
        </section>

        <aside className="flex w-full max-w-xl flex-col gap-6 lg:w-96">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold">Controles</h2>
            {actionButtons}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-300" htmlFor="quick-message">
                Enviar mensaje rápido
              </label>
              <QuickMessageForm onSend={handleSendMessage} />
            </div>
          </div>

          <div className="h-[420px]">
            <ChatPanel messages={messages} />
          </div>
        </aside>
      </div>
    </main>
  );
}

interface QuickMessageFormProps {
  onSend: (text: string) => void;
}

const QuickMessageForm = ({ onSend }: QuickMessageFormProps) => {
  const [text, setText] = useState("");

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        onSend(text);
        setText("");
      }}
    >
      <input
        id="quick-message"
        type="text"
        placeholder="Escribe algo..."
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <button
        type="submit"
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
      >
        Enviar
      </button>
    </form>
  );
};
