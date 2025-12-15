export function setVoice(utterThis, voices, language) {
  if (!language) return;
  for (const voice of voices) {
    if (voice.name === language) {
      return voice;
      break;
    }
  }
}
