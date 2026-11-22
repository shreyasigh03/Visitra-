let audio;

// Like a hand scanner: one high beep for yes, two low ones for no.
export function beep(good) {
  try {
    audio ??= new AudioContext();
    audio.resume();
    for (const start of good ? [0] : [0, 0.22]) {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      tone.frequency.value = good ? 1400 : 320;
      volume.gain.value = 0.15;
      tone.connect(volume).connect(audio.destination);
      tone.start(audio.currentTime + start);
      tone.stop(audio.currentTime + start + 0.15);
    }
  } catch {
    // Sound is only a help.
  }
}
