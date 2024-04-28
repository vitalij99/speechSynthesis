getStorage().then(({ options }) => {
  const btnBook = document.querySelector(".book-popup");
  const { book, bookURL } = options;

  btnBook.innerText = book ? book : "books";
  btnBook.href = bookURL;
});

async function getStorage() {
  return await chrome.storage.sync.get("options");
}
