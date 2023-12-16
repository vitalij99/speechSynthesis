const btnBook = document.getElementById("book");

getStorage().then(({ options }) => {
  const { book, bookURL } = options;
  btnBook.innerText = book ? book : "books";
  btnBook.href = bookURL;
});

async function getStorage() {
  return await chrome.storage.sync.get("options");
}
