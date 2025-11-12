"use client";

import { FC, useEffect, useRef } from "react";

export type ChatMessage = {
  role: "user" | "agent";
  text: string;
};

interface ChatPanelProps {
  messages: ChatMessage[];
}

export const ChatPanel: FC<ChatPanelProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col rounded-xl bg-gray-900/60 p-4 backdrop-blur">
      <h2 className="mb-4 text-lg font-semibold text-white">Transcripción</h2>
      <div ref={containerRef} className="flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400">
            Aún no hay mensajes. Inicia una conversación para ver la transcripción aquí.
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}-${message.text.slice(0, 8)}`}
              className={`rounded-lg border border-white/5 p-3 text-sm leading-relaxed shadow-sm transition hover:border-white/10 ${
                message.role === "user"
                  ? "bg-indigo-500/10 text-indigo-100"
                  : "bg-emerald-500/10 text-emerald-100"
              }`}
            >
              <span className="block text-xs uppercase tracking-wide text-white/60">
                {message.role === "user" ? "Usuario" : "Agente"}
              </span>
              <span className="mt-1 block text-base whitespace-pre-wrap">{message.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
