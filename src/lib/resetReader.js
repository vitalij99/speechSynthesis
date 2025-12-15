export function resetReader({
  synth,
  textContainer,
  paragraf,
  speak,
  options,
  reader,
  clearParagraphStyle,
}) {
  console.log("⏹ Озвучка зупинилася або нема нових слів.");

  if (!options.timerCheckbox || !reader) return;

  clearParagraphStyle(textContainer, paragraf);
  synth.cancel();

  if (!synth.speaking) {
    speak();
  }
}
