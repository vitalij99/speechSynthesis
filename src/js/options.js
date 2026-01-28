import { styles } from "../lib/paragraphStyle";
import { getStorage, setStorage } from "../lib/storage";

const optionsForm = document.getElementById("optionsForm");
const btnBook = document.getElementById("book");
const stylesP = document.getElementById("styleParagraphs");

// storage keys -  navigator,  options,
//  ----------------------------------------
const STORAGE_KEY = "stylesIndex";
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
let stylesIndex = 0;
// ----------------------------------------

loadDataFromStorage();

// Initialize the form with the user's option settings
async function loadDataFromStorage() {
  const data = await getStorage(["navigator", "options", STORAGE_KEY]);

  if (data.navigator) {
    Object.assign(navigator, data.navigator);
  }

  if (data.options) {
    Object.assign(options, data.options);
  }

  if (data.stylesIndex !== undefined) {
    stylesIndex = data.stylesIndex;
  }

  initStylesParagraph();

  console.log({ navigator, options, stylesIndex });

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

function updateStylesParagraph() {}

function initStylesParagraph() {
  for (let i = 0; i < styles.length; i++) {
    const p = document.createElement("p");
    p.textContent = `Style ${i + 1}: text hello world`;

    Object.assign(p.style, styles[i]);

    p.style.cursor = "pointer";

    if (i === stylesIndex) {
      p.classList.add("selected");
    }

    p.addEventListener("click", () => {
      selectStyle(i);
    });

    stylesP.appendChild(p);
  }
}

function selectStyle(index) {
  [...stylesP.children].forEach((el) => el.classList.remove("selected"));

  stylesP.children[index].classList.add("selected");

  setStorage({ [STORAGE_KEY]: index });
  stylesIndex = index;
}
