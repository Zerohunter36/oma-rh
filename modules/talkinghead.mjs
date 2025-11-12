/**
 * Implementación mínima de TalkingHead para fines de demostración.
 * - Crea un canvas 2D que reacciona a datos de audio simulando lip-sync sencillo.
 * - Expone los métodos esperados por la UI: streamStart, streamAudio, streamNotifyEnd y streamStop.
 *
 * Reemplaza este archivo con tu integración real cuando dispongas del motor de TalkingHead.
 */
export class TalkingHead {
  constructor(options = {}) {
    const { mount } = options;
    this.mount = mount ?? null;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    this.ctx = this.canvas.getContext("2d");
    this.animationFrame = null;
    this.mouthIntensity = 0;
    this.lastTimestamp = 0;
    this.isStreaming = false;

    if (this.mount) {
      this.mount.innerHTML = "";
      this.mount.appendChild(this.canvas);
    }

    this.drawIdle();
  }

  attachTo(element) {
    if (!element) return;
    this.mount = element;
    this.mount.innerHTML = "";
    this.mount.appendChild(this.canvas);
  }

  init() {
    this.drawIdle();
  }

  streamStart() {
    this.isStreaming = true;
    this.lastTimestamp = performance.now();
    this.loop();
  }

  streamAudio(frame) {
    if (!ArrayBuffer.isView(frame)) {
      return;
    }
    let energy = 0;
    const length = frame.length || 0;
    for (let i = 0; i < length; i += 1) {
      const sample = frame[i];
      energy += sample * sample;
    }
    const rms = length > 0 ? Math.sqrt(energy / length) : 0;
    this.mouthIntensity = Math.min(1, rms * 8);
  }

  streamNotifyEnd() {
    this.mouthIntensity = 0;
  }

  streamStop() {
    this.isStreaming = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.drawIdle();
  }

  dispose() {
    this.streamStop();
    if (this.mount && this.canvas.parentElement === this.mount) {
      this.mount.removeChild(this.canvas);
    }
  }

  loop() {
    if (!this.isStreaming) {
      return;
    }
    const now = performance.now();
    const delta = now - this.lastTimestamp;
    this.lastTimestamp = now;

    const decay = Math.exp(-delta / 180);
    this.mouthIntensity *= decay;

    this.drawFrame(this.mouthIntensity);
    this.animationFrame = requestAnimationFrame(() => this.loop());
  }

  drawFrame(intensity) {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const faceRadius = 120;

    const gradient = ctx.createRadialGradient(centerX, centerY - 40, 40, centerX, centerY, 160);
    gradient.addColorStop(0, "#ffe1d9");
    gradient.addColorStop(0.6, "#f8b59d");
    gradient.addColorStop(1, "#f29c86");

    ctx.fillStyle = gradient;
    ctx.strokeStyle = "#f39c6b";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, faceRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(centerX - 50, centerY - 40, 32, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + 50, centerY - 40, 32, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(centerX - 50, centerY - 40, 14, 0, Math.PI * 2);
    ctx.arc(centerX + 50, centerY - 40, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#d57f5f";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(centerX - 48, centerY - 60);
    ctx.quadraticCurveTo(centerX, centerY - 72, centerX + 48, centerY - 60);
    ctx.stroke();

    const mouthHeight = 24 + intensity * 70;
    ctx.fillStyle = "#b9325e";
    ctx.strokeStyle = "#8d2549";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(centerX - 60, centerY + 10);
    ctx.quadraticCurveTo(centerX, centerY + mouthHeight, centerX + 60, centerY + 10);
    ctx.quadraticCurveTo(centerX, centerY + mouthHeight + 12, centerX - 60, centerY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawIdle() {
    this.drawFrame(0);
  }
}

export default TalkingHead;
