const optionsForm = document.getElementById("optionsForm");
const btnBook = document.getElementById("book");

// In-page cache of the user's options
const options = {
  reade: false,
  timer: 20,
  paragraf: 0,
  timerCheckbox: true,
  navigator: {
    nextPageBtn: ".nextchap",
    nextPageSave: null,
    thisPageSave: null,
    contentDivElem: "#content",
    bookURL: null,
    book: null,
  },
  utterThis: {
    language: null,
    pitch: 2,
    rate: 2,
    volume: 1,
  },
};

// run fn
loadDataFromStorage();

// Initialize the form with the user's option settings
async function loadDataFromStorage() {
  const data = await chrome.storage.sync.get("options");
  Object.assign(options, data.options);

  console.log(options);

  optionsForm.contentDivElem.value = options.navigator.contentDivElem;
  optionsForm.nextPage.value = options.navigator.nextPageBtn;

  btnBook.innerText = options.navigator.book ? options.navigator.book : "books";
  btnBook.href = options.navigator.bookURL;
}

// Immediately persist options changes
optionsForm.addEventListener("change", () => {
  options.navigator.contentDivElem = optionsForm.contentDivElem.value;
  options.navigator.nextPageBtn = optionsForm.nextPage.value;

  chrome.storage.sync.set({ options });
  console.log(options);
});
