// popup.js
const btnStartReader = document.getElementById("startReader");

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let key in changes) {
    let storageChange = changes[key];
    updatePopup(storageChange.newValue);
  }
});

getStorage().then(({ options }) => {
  updatePopup(options);

  btnStartReader.addEventListener("click", function () {
    const isReader = getDateReade(options.reade);

    if (isReader) {
      chrome.runtime.sendMessage("stopScript");
      options.reade = null;
      chrome.storage.sync.set({ options });
    } else {
      chrome.runtime.sendMessage("firstTimeScript");
      window.close();
    }
  });
});

function getDateReade(reade) {
  const dateSave = new Date(reade);
  const dateNow = new Date();

  return reade && dateSave > dateNow;
}
async function getStorage() {
  return await chrome.storage.sync.get("options");
}

const updatePopup = (options) => {
  const btnBook = document.querySelector(".book-popup");

  const isReader = getDateReade(options.reade);
  btnStartReader.textContent = isReader ? "stop" : "Play";

  btnBook.textContent = options.navigator.book
    ? options.navigator.book
    : "Last start reade";
  btnBook.href = options.navigator.bookURL;
};
