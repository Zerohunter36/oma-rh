export interface TalkingHeadPublicAPI {
  init?: () => void;
  attachTo?: (element: HTMLElement | null) => void;
  streamStart?: () => void;
  streamAudio?: (frame: Float32Array | Int16Array | Uint8Array) => void;
  streamNotifyEnd?: () => void;
  streamStop?: () => void;
  dispose?: () => void;
}

export class TalkingHead implements TalkingHeadPublicAPI {
  constructor(options?: { mount?: HTMLElement | null });
  init?: () => void;
  attachTo?: (element: HTMLElement | null) => void;
  streamStart?: () => void;
  streamAudio?: (frame: Float32Array | Int16Array | Uint8Array) => void;
  streamNotifyEnd?: () => void;
  streamStop?: () => void;
  dispose?: () => void;
}

export default TalkingHead;
