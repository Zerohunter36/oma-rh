import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talking Head + ElevenLabs Demo",
  description:
    "Demostración en Next.js que conecta ElevenLabs Agents en tiempo real con un avatar 2D animado y panel de chat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-black font-sans antialiased text-white">{children}</body>
    </html>
  );
}
