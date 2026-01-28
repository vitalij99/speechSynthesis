export function clearParagraphStyle(container, index) {
  try {
    container.children[index].style = "";
  } catch {
    return;
  }
}
export function styleCurrentParagraph(container, index) {
  try {
    const paragraph = container.children[index];

    paragraph.style.backdropFilter = "blur(10px)";
    paragraph.style.background = "rgba(255, 255, 255, 0.15)";
    paragraph.style.filter = "invert(1)";
    paragraph.style.borderRadius = "6px";
    paragraph.style.outline = "2px solid rgba(0,0,0,0.9)";
  } catch (error) {
    console.error("Error styling paragraph:", error);
  }
}
