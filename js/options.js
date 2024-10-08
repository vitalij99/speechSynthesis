const optionsForm = document.getElementById("optionsForm");
const btnBook = document.getElementById("book");

// In-page cache of the user's options
const options = {
  reade: false,
  timer: 20,
  paragraf: 0,
  lastParagraf: 0,
  timerCheckbox: true,
  timeout: 2000,
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

loadDataFromStorage();

// Initialize the form with the user's option settings
async function loadDataFromStorage() {
  const data = await chrome.storage.sync.get("options");
  Object.assign(options, data.options);

  console.log(options);

  optionsForm.contentDivElem.value = options.navigator.contentDivElem;
  optionsForm.nextPage.value = options.navigator.nextPageBtn;
  optionsForm.lastParagraf.value = options.lastParagraf;
  optionsForm.timeout.value = options.timeout;

  btnBook.textContent = options.navigator.book
    ? options.navigator.book
    : "books";
  btnBook.href = options.navigator.bookURL;
}

// Immediately persist options changes
optionsForm.addEventListener("change", () => {
  options.navigator.contentDivElem = optionsForm.contentDivElem.value;
  options.navigator.nextPageBtn = optionsForm.nextPage.value;
  options.lastParagraf = optionsForm.lastParagraf.value;
  options.timeout = optionsForm.timeout.value;

  chrome.storage.sync.set({ options });
  console.log(options);
});
// TODO add button
function clearStorage() {
  chrome.storage.sync.remove("options");
}
