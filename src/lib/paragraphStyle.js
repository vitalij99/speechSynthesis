export function clearParagraphStyle(container, index) {
  try {
    container.children[index].style = "";
  } catch {
    return;
  }
}

let stylesIndex = 0;

export async function initStyles() {
  await chrome.storage.sync.get(["stylesIndex"], (result) => {
    if (result.stylesIndex !== undefined) {
      stylesIndex = result.stylesIndex;
    }
  });
}
const allStyles = {
  backdropFilter: "blur(10px)",
  borderRadius: "6px",
  outlineOffset: "3px",
};
export const styles = [
  {
    ...allStyles,
    background: "rgba(0, 0, 255, 0.15)",
    outline: "2px solid blue",
  },
  {
    ...allStyles,
    background: "rgba(0, 0, 255, 0.15)",
    outline: "2px solid yellow",
    filter: "invert(1)",
  },
  {
    ...allStyles,
    background: "rgba(255, 255, 0, 0.15)",
    outline: "2px solid orange",
  },
  {
    ...allStyles,
    background: "rgba(255, 255, 0, 0.15)",
    outline: "2px solid rgb(0, 95, 255)",
    filter: "invert(1)",
  },
  {
    ...allStyles,
    background: "rgba(255, 255, 255, 0.15)",
    outline: "2px solid cyan",
  },
  {
    ...allStyles,
    background: "rgba(255, 255, 255, 0.15)",
    outline: "2px solid red",
    filter: "invert(1)",
  },
  {
    ...allStyles,
    background: "rgba(255, 255, 255, 0.15)",
  },
  {
    ...allStyles,
    background: "rgba(255, 255, 255, 0.15)",

    filter: "invert(1)",
  },
];

export function styleCurrentParagraph(container, index) {
  try {
    const paragraph = container.children[index];

    const style = getStyles();

    Object.assign(paragraph.style, style);
  } catch (error) {
    console.error("Error styling paragraph:", error);
  }
}
function getStyles() {
  return { ...styles[stylesIndex % styles.length] };
}
chrome.storage.onChanged.addListener((changes) => {
  if (changes.stylesIndex) {
    if (changes.stylesIndex.newValue !== stylesIndex) {
      stylesIndex = changes.stylesIndex.newValue;
    }
  }
});
