document.getElementById("startReader").addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "startReadeFun" });
  });
});

getStorage().then(({ options }) => {
  const btnBook = document.querySelector(".book-popup");
  const { book, bookURL } = options;

  btnBook.innerText = book ? book : "books";
  btnBook.href = bookURL;
});

async function getStorage() {
  return await chrome.storage.sync.get("options");
}
