export const navigator = {
  nextPageSave: null,
  thisPageSave: null,
  bookURL: null,
  book: null,
};

export const options = {
  contentDivElem: "#content  ",
  nextPageBtn: ".nextchap",
  timer: 20,
  lastParagraf: 0,
  timerCheckbox: true,
  timeout: 2000,
  utterThis: {
    language: null,
    pitch: 2,
    rate: 2,
    volume: 1,
  },
};
// ----------------------------------------
let lastData = null;
let saveDataTimeout = null;

export function setSaveData(data) {
  lastData = {
    ...lastData,
    ...data,
  };

  if (saveDataTimeout) clearTimeout(saveDataTimeout);

  saveDataTimeout = setTimeout(() => {
    chrome.storage.sync.set(
      Object.fromEntries(
        Object.entries(lastData).filter(([_, v]) => v !== undefined)
      )
    );
    lastData = null;
    saveDataTimeout = null;
  }, 300);
}

export function getStorageData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ["reader", "navigator", "options", "paragraf"],
      (result) => {
        resolve(result);
      }
    );
  });
}
