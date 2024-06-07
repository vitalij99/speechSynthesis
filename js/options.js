const optionsForm = document.getElementById("optionsForm");
const btnBook = document.getElementById("book");

// In-page cache of the user's options
const options = {
  contentDivElem: "#content",
  nextPage: "nextchap",
  rate: 1,
  pitch: 1,
  language: "Google español",
  reade: false,
  timer: 20,
  book: "",
  bookURL: "",
  paragraf: 0,
  contentDivElem: "#content",
  nextPageSave: null,
};

// run fn
loadDataFromStorage();

// Initialize the form with the user's option settings
async function loadDataFromStorage() {
  const data = await chrome.storage.sync.get("options");
  Object.assign(options, data.options);

  console.log(options);

  optionsForm.contentDivElem.value = options.contentDivElem;
  optionsForm.nextPage.value = options.nextPage;

  btnBook.innerText = options.book ? options.book : "books";
  btnBook.href = options.bookURL;
}

// Immediately persist options changes
optionsForm.addEventListener("change", () => {
  options.contentDivElem = optionsForm.contentDivElem.value;
  options.nextPage = optionsForm.nextPage.value;

  chrome.storage.sync.set({ options });
  console.log(options);
});
