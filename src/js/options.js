import { getStorage, setStorage } from "../lib/storage";

const optionsForm = document.getElementById("optionsForm");
const btnBook = document.getElementById("book");

// storage keys -  navigator,  options,
//  ----------------------------------------

const navigator = {
  nextPageSave: null,
  thisPageSave: null,
  bookURL: null,
  book: null,
};

const options = {
  contentDivElem: "#content  ",
  nextPageBtn: ".nextchap",
  timer: 20,
  lastParagraf: 0,
  timerCheckbox: true,
  timeout: 2000,
  utterThis: {
    language: null,
    pitch: 2,
    rate: 2,
    volume: 1,
  },
};
// ----------------------------------------

loadDataFromStorage();

// Initialize the form with the user's option settings
async function loadDataFromStorage() {
  const data = await getStorage(["navigator", "options"]);

  if (data.navigator) {
    Object.assign(navigator, data.navigator);
  }

  if (data.options) {
    Object.assign(options, data.options);
  }

  console.log({ navigator, options });

  optionsForm.contentDivElem.value = options.contentDivElem;
  optionsForm.nextPage.value = options.nextPageBtn;
  optionsForm.lastParagraf.value = options.lastParagraf;
  optionsForm.timeout.value = options.timeout;

  btnBook.textContent = navigator.book || "books";
  btnBook.href = navigator.bookURL;
}

optionsForm.addEventListener("change", () => {
  options.contentDivElem = optionsForm.contentDivElem.value;
  options.nextPageBtn = optionsForm.nextPage.value;
  options.lastParagraf = optionsForm.lastParagraf.value;
  options.timeout = optionsForm.timeout.value;

  setStorage({ options });
  console.log({ options });
});
