export function configureButtons({
  textContainer,
  synth,
  paused = false,
  paragraf = 0,
  speak,
  handleParagraphChange,
  handleStartClick,
  handleStopClick,
}) {
  const buttonStart = document.getElementById("start");
  const buttonStop = document.getElementById("stop");
  const inputParagraf = document.getElementById("inputParagrafs");
  const punktParagrafs = document.getElementById("paragrafs");

  buttonStart.textContent = !paused ? "Pause" : "Play";

  punktParagrafs.textContent = textContainer.children.length;
  inputParagraf.max = textContainer.children.length;
  inputParagraf.value = paragraf;

  buttonStart.onclick = () => handleStartClick(buttonStart);
  buttonStop.onclick = () => handleStopClick(buttonStart);

  inputParagraf.onchange = () => handleParagraphChange(inputParagraf);
}
