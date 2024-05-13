const btnStartReader = document.getElementById("startReader");

btnStartReader.addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "startReadeFun" });
  });
  btnStartReader.disabled = true;
});

getStorage().then(({ options }) => {
  const btnBook = document.querySelector(".book-popup");
  const { book, bookURL, reade, timerCheckbox } = options;

  btnBook.innerText = book ? book : "Last book";
  btnBook.href = bookURL;

  const dateSave = new Date(reade);
  const dateNow = new Date();

  if (reade && timerCheckbox && dateSave > dateNow) {
    btnStartReader.disabled = true;
  } else btnStartReader.disabled = false;
});

async function getStorage() {
  return await chrome.storage.sync.get("options");
}
