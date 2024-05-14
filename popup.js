const btnStartReader = document.getElementById("startReader");

btnStartReader.addEventListener("click", function () {
  chrome.runtime.sendMessage("firstTimeScript", () => {
    btnStartReader.disabled = true;
  });
});

getStorage().then(({ options }) => {
  const btnBook = document.querySelector(".book-popup");
  const { book, bookURL } = options;

  btnBook.innerText = book ? book : "Last book";
  btnBook.href = bookURL;

  btnStartReader.disabled = false;
});

async function getStorage() {
  return await chrome.storage.sync.get("options");
}
