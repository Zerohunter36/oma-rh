# Talking Head + ElevenLabs Demo Frontpage

Aplicación Next.js 14 (App Router + TypeScript + TailwindCSS) que muestra una experiencia conversacional en tiempo real con:

- Streaming de audio desde el micrófono del usuario hacia **ElevenLabs Agents** (vía WebSocket).
- Reproducción del audio de respuesta en el navegador con **WebAudio**.
- Lip-sync 2D básico basado en energía RMS para representar la animación de la boca.
- Panel de chat para visualizar transcripciones de usuario y agente.

> **Nota:** La conexión directa al WebSocket de ElevenLabs requiere proteger la API key mediante un **proxy backend**. Incluimos un ejemplo mínimo para que puedas levantarlo en tu propio entorno.

## Requisitos previos

- Node.js 18 o superior
- npm 9+ (o tu gestor preferido como `pnpm`/`yarn`)
- Cuenta de ElevenLabs con acceso a Agents API y un `agent_id`

## Instalación

1. Clona el repositorio e instala dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
   ```bash
   NEXT_PUBLIC_AGENT_WS_URL=wss://tu-dominio.com/api/agents-ws
   NEXT_PUBLIC_AGENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
   - `NEXT_PUBLIC_AGENT_WS_URL` debe apuntar a tu proxy WebSocket (ver sección [Proxy WebSocket](#proxy-websocket)).
   - `NEXT_PUBLIC_AGENT_ID` es opcional si lo incluyes en la URL del proxy, pero el hook lo usa para enviar la configuración de conversación inicial.

## Scripts disponibles

- `npm run dev`: servidor de desarrollo en `http://localhost:3000`.
- `npm run build`: build de producción.
- `npm run start`: ejecuta el build de producción.
- `npm run lint`: ejecuta el linter configurado por Next.js.

## Uso

1. Arranca el proxy WebSocket (ver sección siguiente).
2. Inicia el entorno de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre `http://localhost:3000` y permite el acceso al micrófono cuando el navegador lo solicite.
4. Presiona **Iniciar conversación** para abrir el WebSocket, comenzar a enviar audio y recibir las respuestas del agente en tiempo real.
5. Usa el formulario “Enviar mensaje rápido” para mandar texto adicional al agente mientras mantienes la sesión abierta.

## Proxy WebSocket

Los navegadores no permiten añadir headers personalizados a WebSockets, por lo que es necesario un proxy que adjunte la cabecera `xi-api-key` y mantenga la conexión con ElevenLabs. Puedes reutilizar el proxy de tu preferencia; a continuación se muestra un ejemplo minimalista con Express y `http-proxy`:

```ts
// server/proxy.ts
import express from "express";
import { createProxyServer } from "http-proxy";

const ELEVENLABS_WS = "wss://api.elevenlabs.io/v1/convai/conversation";
const XI_API_KEY = process.env.ELEVENLABS_API_KEY!;

const app = express();
const proxy = createProxyServer({ target: ELEVENLABS_WS, ws: true, changeOrigin: true, secure: true });

proxy.on("proxyReqWs", (proxyReq) => {
  proxyReq.setHeader("xi-api-key", XI_API_KEY);
  proxyReq.setHeader("User-Agent", "TalkingHead-Demo/1.0");
});

app.get("/health", (_, res) => res.send("ok"));

const server = app.listen(process.env.PORT ?? 3001, () => {
  console.log(`Proxy ready on port ${process.env.PORT ?? 3001}`);
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "", "http://localhost");
  const agentId = url.searchParams.get("agent_id");
  const target = agentId ? `${ELEVENLABS_WS}?agent_id=${agentId}` : ELEVENLABS_WS;
  proxy.ws(req, socket, head, { target });
});
```

Ejecuta el proxy con:
```bash
ELEVENLABS_API_KEY=tu_api_key node server/proxy.ts
```
Luego apunta `NEXT_PUBLIC_AGENT_WS_URL` a `ws://localhost:3001?agent_id=tu-agent-id` o a la URL desplegada en tu infraestructura.

## Arquitectura del cliente

- `app/page.tsx`: layout principal, controles, badges de estado y montaje del avatar.
- `hooks/useElevenLabsConversation.ts`: orquesta el WebSocket, captura de micrófono, reproducción de audio y actualización de transcripciones.
- `components/Avatar2D.tsx`: avatar SVG animado en base al nivel RMS del audio recibido.
- `components/ChatPanel.tsx`: historial de mensajes con auto-scroll.
- `lib/audio/*`: utilidades para convertir audio (`Float32Array → PCM16`), codificar en base64 y reproducir mediante `AudioContext`.

## Personalización y siguientes pasos

- Sustituye `Avatar2D` por una implementación con **TalkingHead** o cualquier motor 3D. Puedes enganchar tu pipeline en `useElevenLabsConversation` aprovechando el callback `handleAudioFrame` para alimentar visemas.
- Ajusta el mensaje de inicio (`conversation_initiation_client_data`) en el hook para personalizar voz, idioma o prompt del agente.
- Implementa lógica adicional para reconexiones, indicaciones visuales de buffering y gestión de errores específicos devueltos por ElevenLabs.

## Despliegue

Sigue la guía oficial de Next.js para Vercel, Netlify u otra plataforma. Recuerda configurar las variables de entorno (`NEXT_PUBLIC_AGENT_WS_URL`, `NEXT_PUBLIC_AGENT_ID` y `ELEVENLABS_API_KEY` en tu proxy) antes de publicar.
