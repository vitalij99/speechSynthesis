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
  const shadowHost = document.getElementById("chrome-ext-shadow-root");
  const shadowRoot = shadowHost?.shadowRoot;
  if (!shadowRoot) {
    console.error("Shadow DOM not found. Call createHTMLButton() first.");
    return;
  }

  const buttonStart = shadowRoot.getElementById("start");
  const buttonStop = shadowRoot.getElementById("stop");
  const inputParagraf = shadowRoot.getElementById("inputParagrafs");
  const punktParagrafs = shadowRoot.getElementById("paragrafs");

  buttonStart.textContent = !paused ? "Pause" : "Play";

  punktParagrafs.textContent = textContainer.children.length;
  inputParagraf.max = textContainer.children.length;
  inputParagraf.value = paragraf;

  buttonStart.onclick = () => handleStartClick(buttonStart);
  buttonStop.onclick = () => handleStopClick(buttonStart);

  inputParagraf.onchange = () => handleParagraphChange(inputParagraf);
}
