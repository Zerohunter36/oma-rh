const TARGET_SAMPLE_RATE = 16000;

export function downsampleTo16kPCM16(
  input: Float32Array,
  inputSampleRate: number,
): Int16Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) {
    const buffer = new Int16Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      const s = Math.max(-1, Math.min(1, input[i]));
      buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return buffer;
  }

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / ratio);
  const outputBuffer = new Int16Array(outputLength);

  let outputOffset = 0;
  let inputOffset = 0;
  while (outputOffset < outputLength) {
    const nextInputOffset = Math.round((outputOffset + 1) * ratio);
    let accum = 0;
    let count = 0;

    for (let i = inputOffset; i < nextInputOffset && i < input.length; i += 1) {
      accum += input[i];
      count += 1;
    }

    const sample = count > 0 ? accum / count : 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    outputBuffer[outputOffset] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;

    inputOffset = nextInputOffset;
    outputOffset += 1;
  }

  return outputBuffer;
}

export function encodePCM16ToBase64(samples: Int16Array): string {
  const view = new Uint8Array(samples.buffer);
  let binary = "";
  for (let i = 0; i < view.length; i += 1) {
    binary += String.fromCharCode(view[i]);
  }
  return btoa(binary);
}

export function decodeBase64ToPCM16(base64: string): Int16Array {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    view[i] = binary.charCodeAt(i);
  }
  return new Int16Array(buffer);
}
