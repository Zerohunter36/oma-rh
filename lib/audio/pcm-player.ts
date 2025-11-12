export type OnAudioFrame = (frame: Float32Array) => void;

export class PCMPlayer {
  private context: AudioContext;
  private destination: GainNode;
  private scheduledTime = 0;
  private onAudioFrame?: OnAudioFrame;

  constructor(context: AudioContext, onAudioFrame?: OnAudioFrame) {
    this.context = context;
    this.destination = this.context.createGain();
    this.destination.connect(this.context.destination);
    this.onAudioFrame = onAudioFrame;
  }

  enqueue(int16: Int16Array, sampleRate = 16000) {
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i += 1) {
      float32[i] = int16[i] / 0x8000;
    }

    if (this.onAudioFrame) {
      this.onAudioFrame(float32);
    }

    const buffer = this.context.createBuffer(1, float32.length, sampleRate);
    buffer.copyToChannel(float32, 0);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.destination);

    const startAt = Math.max(this.context.currentTime, this.scheduledTime);
    source.start(startAt);
    this.scheduledTime = startAt + buffer.duration;
  }

  stop() {
    this.destination.disconnect();
  }
}
