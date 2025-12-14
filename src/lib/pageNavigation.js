export function getHtmlElements(selector, document = window.document) {
  try {
    return (
      selector
        .split("\n")
        .map((name) => {
          if (!name.trim()) return null;
          try {
            return document.querySelector(name);
          } catch {
            return null;
          }
        })
        .filter(Boolean)?.[0] || null
    );
  } catch {
    return null;
  }
}
function getNextPage(document = window.document) {
  const urlPage = document.URL;
  const numbers = [];

  for (let index = 1; index < urlPage.length; index++) {
    const element = urlPage[urlPage.length - index];
    if (!isNaN(element)) {
      numbers.unshift(element);
    } else if (index !== 1) {
      const newUrlPage = urlPage.slice(0, urlPage.length - index + 1);
      const number = parseInt(numbers.join("")) + 1;

      return newUrlPage + number;
    } else {
      return urlPage;
    }
  }

  return urlPage;
}
export function setNextPage({ options, setSaveData, navigator }) {
  const nextPageButton = getHtmlElements(options.nextPageBtn);

  navigator.thisPageSave = document.URL;

  navigator.nextPageSave = nextPageButton
    ? nextPageButton?.attributes?.href?.value
    : getNextPage();
  setSaveData({ navigator });
}
