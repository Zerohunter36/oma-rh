"use client";

import { FormEvent, useMemo, useState } from "react";
import Avatar2D from "../components/Avatar2D";
import ChatPanel from "../components/ChatPanel";
import { useElevenLabsConversation } from "../hooks/useElevenLabsConversation";

const STATUS_COPY: Record<string, string> = {
  idle: "Inactivo",
  connecting: "Conectando...",
  connected: "En conversación",
  error: "Error",
};

export default function HomePage() {
  const {
    messages,
    status,
    error,
    isMicrophoneActive,
    mouthOpenAmount,
    startConversation,
    stopConversation,
    sendTextMessage,
  } = useElevenLabsConversation();

  const statusLabel = useMemo(() => STATUS_COPY[status] ?? status, [status]);
  const isConnected = status === "connected";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row">
        <section className="flex-1 space-y-6">
          <header className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Talking Head + ElevenLabs Demo
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300 md:text-base">
              Demostración completa de una experiencia conversacional en tiempo real usando ElevenLabs Agents y un avatar 2D
              sincronizado por energía de audio. Configura tus credenciales en variables de entorno y presiona “Iniciar
              conversación” para comenzar.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-300">
              <StatusBadge status={statusLabel} tone={status} />
              <MicrophoneBadge active={isMicrophoneActive} />
            </div>
            {error ? (
              <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/20 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            ) : null}
          </header>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold">Avatar en vivo</h2>
            <div
              id="avatar-container"
              className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-black/60"
            >
              <Avatar2D mouthOpenAmount={mouthOpenAmount} speaking={isConnected} />
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Este avatar 2D responde en tiempo real a la energía del audio recibido del agente. Sustituye el componente por tu
              pipeline de TalkingHead si prefieres un modelo 3D.
            </p>
          </div>
        </section>

        <aside className="flex w-full max-w-xl flex-col gap-6 lg:w-96">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold">Controles</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={startConversation}
                className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isConnected || status === "connecting"}
              >
                {status === "connecting" ? "Conectando..." : "Iniciar conversación"}
              </button>
              <button
                onClick={stopConversation}
                className="flex-1 rounded-lg bg-rose-500 px-4 py-2 font-semibold text-white shadow hover:bg-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={status === "idle"}
              >
                Detener conversación
              </button>
            </div>
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-300" htmlFor="quick-message">
                Enviar mensaje rápido (texto)
              </label>
              <QuickMessageForm onSend={sendTextMessage} disabled={!isConnected} />
            </div>
            <div className="mt-6 space-y-2 text-xs text-gray-400">
              <p>
                Variables necesarias:
                <code className="ml-2 rounded bg-black/40 px-2 py-1 text-[11px]">NEXT_PUBLIC_AGENT_WS_URL</code>
                {" y "}
                <code className="ml-1 rounded bg-black/40 px-2 py-1 text-[11px]">NEXT_PUBLIC_AGENT_ID</code>
                .
              </p>
              <p>
                La URL debe apuntar a tu proxy WebSocket que firme la conexión con ElevenLabs usando tu
                <code className="mx-1">xi-api-key</code>.
              </p>
            </div>
          </div>

          <div className="h-[460px]">
            <ChatPanel messages={messages} />
          </div>
        </aside>
      </div>
    </main>
  );
}

interface QuickMessageFormProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const QuickMessageForm = ({ onSend, disabled }: QuickMessageFormProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }
    onSend(value.trim());
    setValue("");
  };

  return (
    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
      <input
        id="quick-message"
        type="text"
        placeholder={disabled ? "Conecta para enviar mensajes" : "Escribe algo..."}
        disabled={disabled}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Enviar
      </button>
    </form>
  );
};

interface StatusBadgeProps {
  status: string;
  tone: string;
}

const StatusBadge = ({ status, tone }: StatusBadgeProps) => {
  const toneStyles: Record<string, string> = {
    idle: "bg-gray-500/20 text-gray-200 border-gray-500/40",
    connecting: "bg-amber-500/20 text-amber-100 border-amber-500/40",
    connected: "bg-emerald-500/20 text-emerald-100 border-emerald-500/40",
    error: "bg-rose-500/20 text-rose-100 border-rose-500/40",
  };

  const style = toneStyles[tone] ?? toneStyles.idle;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {status}
    </span>
  );
};

interface MicrophoneBadgeProps {
  active: boolean;
}

const MicrophoneBadge = ({ active }: MicrophoneBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        active
          ? "border-sky-500/40 bg-sky-500/20 text-sky-100"
          : "border-gray-600/40 bg-gray-600/10 text-gray-300"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 0 1 2 0 7 7 0 0 1-6 6.93V21a1 1 0 0 1-2 0v-2.07A7 7 0 0 1 5 12a1 1 0 0 1 2 0 5 5 0 0 0 10 0Z"
          fill="currentColor"
        />
      </svg>
      {active ? "Micrófono activo" : "Micrófono inactivo"}
    </span>
  );
};
