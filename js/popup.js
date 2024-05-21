// popup.js
const btnStartReader = document.getElementById("startReader");

btnStartReader.addEventListener("click", function () {
  chrome.runtime.sendMessage("firstTimeScript", () => {
    btnStartReader.disabled = true;
  });
  window.close();
  console.log("stop");
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let key in changes) {
    let storageChange = changes[key];
    updatePopup(storageChange.newValue);
  }
});

getStorage().then(({ options }) => {
  updatePopup(options);

  btnStartReader.disabled = false;
});

async function getStorage() {
  return await chrome.storage.sync.get("options");
}

const updatePopup = (options) => {
  const btnBook = document.querySelector(".book-popup");
  const { book, bookURL } = options;

  btnBook.innerText = book ? book : "Last start reade";
  btnBook.href = bookURL;
};
