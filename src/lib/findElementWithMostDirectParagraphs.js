import { IGNORED_CLASS } from "../ver/ver";

export function findElementWithMostDirectParagraphs() {
  console.log("Finding element with most direct paragraphs...");

  const allElements = document.querySelectorAll("body *");
  let maxCount = 0;
  let bestElement = null;

  for (let el of allElements) {
    if (el.closest("." + IGNORED_CLASS)) continue;

    let count = 0;

    for (let child of el.children) {
      if (child.classList.contains(IGNORED_CLASS)) continue;

      if (
        child.tagName === "P" ||
        child.tagName === "SPAN" ||
        child.tagName === "DIV"
      ) {
        count++;
      }
    }

    if (count > maxCount) {
      maxCount = count;
      bestElement = el;
    }
  }

  return bestElement;
}
