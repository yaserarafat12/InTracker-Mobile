// Preload audio buffer for instant playback
const notifSrc = '/sound/notif.mp3';
let audioContext: AudioContext | null = null;
let notifBuffer: AudioBuffer | null = null;

// Preload on first user interaction (browser policy)
async function ensureLoaded() {
  if (notifBuffer) return;
  try {
    if (!audioContext) audioContext = new AudioContext();
    const response = await fetch(notifSrc);
    const arrayBuffer = await response.arrayBuffer();
    notifBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch {
    // Fallback: will use HTML Audio
  }
}

// Eagerly preload
if (typeof window !== 'undefined') {
  // Preload on first click/touch anywhere
  const preload = () => { ensureLoaded(); document.removeEventListener('click', preload); document.removeEventListener('touchstart', preload); };
  document.addEventListener('click', preload, { once: true });
  document.addEventListener('touchstart', preload, { once: true });
}

// Fallback HTML Audio (for first play before WebAudio loads)
const fallbackAudio = new Audio(notifSrc);
fallbackAudio.volume = 0.6;
fallbackAudio.preload = 'auto';

export function playNotifSfx() {
  // Try WebAudio (instant, no latency)
  if (audioContext && notifBuffer) {
    if (audioContext.state === 'suspended') audioContext.resume();
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    gain.gain.value = 0.6;
    source.buffer = notifBuffer;
    source.connect(gain).connect(audioContext.destination);
    source.start(0);
    return;
  }
  // Fallback HTML Audio
  fallbackAudio.currentTime = 0;
  fallbackAudio.play().catch(() => {});
}
