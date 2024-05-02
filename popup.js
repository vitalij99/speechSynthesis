const btnStartReader = document.getElementById("startReader");

btnStartReader.addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "startReadeFun" });
  });
  btnStartReader.disabled = true;
});

getStorage().then(({ options }) => {
  const btnBook = document.querySelector(".book-popup");
  const { book, bookURL, reade } = options;

  btnBook.innerText = book ? book : "books";
  btnBook.href = bookURL;

  btnStartReader.disabled = false;
});

async function getStorage() {
  return await chrome.storage.sync.get("options");
}
