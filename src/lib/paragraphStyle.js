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

const styles = [
  {
    background: "rgba(255, 0, 0, 0.15)",
    outline: "2px solid red",
    filter: "invert(0)",
  },
  {
    background: "rgba(0, 255, 0, 0.15)",
    outline: "2px solid green",
    filter: "invert(1)",
  },
  {
    background: "rgba(0, 0, 255, 0.15)",
    outline: "2px solid blue",
    filter: "invert(0)",
  },
  {
    background: "rgba(255, 255, 0, 0.15)",
    outline: "2px solid orange",
    filter: "invert(1)",
  },
  {
    background: "rgba(255, 0, 255, 0.15)",
    outline: "2px solid purple",
    filter: "invert(0)",
  },
  {
    outline: "2px solid cyan",
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
  const allStyles = {
    backdropFilter: "blur(10px)",
    background: "rgba(255, 255, 255, 0.15)",
    borderRadius: "6px",
  };

  return { ...allStyles, ...styles[stylesIndex % styles.length] };
}
chrome.storage.onChanged.addListener((changes) => {
  if (changes.stylesIndex) {
    if (changes.stylesIndex.newValue !== stylesIndex) {
      stylesIndex = changes.stylesIndex.newValue;
    }
  }
});
