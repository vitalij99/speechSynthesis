export function clearParagraphStyle(container, index) {
  try {
    container.children[index].style = "";
  } catch {
    return;
  }
}
