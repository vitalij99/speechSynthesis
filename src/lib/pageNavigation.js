import { setSaveData } from "./storageContent";

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
  const url = new URL(document.URL);

  const pathMatch = url.pathname.match(/(\d+)(\/?)$/);

  if (pathMatch) {
    const [, digits, trailingSlash] = pathMatch;
    const nextNumber = parseInt(digits, 10) + 1;
    url.pathname =
      url.pathname.slice(0, pathMatch.index) + nextNumber + trailingSlash;
    return url.href;
  }

  // 2 ?page=5
  const pageParam = url.searchParams.get("page");

  if (pageParam !== null && !isNaN(pageParam)) {
    const nextNumber = parseInt(pageParam, 10) + 1;
    url.searchParams.set("page", nextNumber);
    return url.href;
  }

  return url.href;
}
export function setNextPage({ nextPageBtn }) {
  const nextPageButton = getHtmlElements(nextPageBtn);

  return nextPageButton
    ? nextPageButton?.attributes?.href?.value
    : getNextPage();
}

export function saveThisPage({ navigator }) {
  navigator.thisPageSave = document.URL;
  setSaveData({ navigator });
}

export function moveToNextPage({ nextPageBtn }) {
  setSaveData({ paragraf: 0 });

  const initialURL = window.location.href;

  pressArrowRight();

  console.log(
    "Dispatched right arrow key events to navigate to the next page.",
  );

  setTimeout(() => {
    const nextPageURL = setNextPage({ nextPageBtn });
    console.log("Next page URL determined:", { nextPageURL, initialURL });
    if (window.location.href === initialURL) {
      if (
        nextPageURL === initialURL ||
        !nextPageURL ||
        nextPageURL?.length < 5
      ) {
        console.log("No next page URL found.");
        return;
      }

      chrome.runtime.sendMessage({ action: "goToNextPage" });

      window.location.href = nextPageURL;
    } else {
      // move to next page not uploaded in background.js
      console.log("Navigated to next page via keyboard event.");

      location.reload();
    }
  }, 2000);
}
function pressArrowRight() {
  const baseParams = {
    key: "ArrowRight",
    code: "ArrowRight",
    keyCode: 39,
    which: 39,
    bubbles: true,
    cancelable: true,
  };

  function fireKey(type, eventTarget) {
    const event = new KeyboardEvent(type, baseParams);

    Object.defineProperty(event, "keyCode", { get: () => 39 });
    Object.defineProperty(event, "which", { get: () => 39 });
    eventTarget.dispatchEvent(event);
    return event;
  }
  const targetDocument =
    document.activeElement && document.activeElement !== document.body
      ? document.activeElement
      : document;
  console.log("Moving to next page with ArrowRight on:", targetDocument);

  fireKey("keydown", targetDocument);
  fireKey("keyup", targetDocument);

  fireKey("keydown", window);
  fireKey("keyup", window);
  fireKey("keydown", document);
  fireKey("keyup", document);

  return true;
}
