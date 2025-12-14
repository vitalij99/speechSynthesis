export function checkText(str) {
  if (!str) return "";
  const regex = /[\p{L}\p{N}]/u;
  if (str && regex.test(str))
    return str.replace(/(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu, "");
}

export function checkChildrenVisibility(textElement) {
  if (!textElement) return null;

  const results = [];

  const children = Array.from(textElement.childNodes);

  children.forEach((node) => {
    const text = node.textContent?.trim();
    if (!text) return;

    let rect = null;

    try {
      if (node.nodeType === Node.ELEMENT_NODE) {
        rect = node.getBoundingClientRect();
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.selectNodeContents(node);
        rect = range.getBoundingClientRect();
      }

      if (!rect) return;

      const isVisible = rect.height > 1 && rect.width > 0;

      if (isVisible) {
        results.push(text);
      } else {
        console.log("Hidden text node:", text);
      }
    } catch (error) {
      console.error("Error checking children visibility:", error);
    }
  });

  return results.length ? results.join(", ") : null;
}
