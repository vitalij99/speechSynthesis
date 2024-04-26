const synth = window.speechSynthesis;
const voiceSelect = document.querySelector("select");
const optionsForm = document.getElementById("optionsForm");

const pitch = document.querySelector("#pitch");
const pitchValue = document.querySelector(".pitch-value");
const rate = document.querySelector("#rate");
const rateValue = document.querySelector(".rate-value");
const timer = document.querySelector("#timer");
const timerValue = document.querySelector(".timer-value");
const btnBook = document.getElementById("book");

// In-page cache of the user's options
const options = {
  contentDivElem: "#content",
  nextPage: "nextchap",
  rate: 1,
  pitch: 1,
  language: null,
  reade: null,
  timer: 2,
  book: "",
  bookURL: "",
  paragraf: 0,
};
const getTimeFormat = (timer, timerValue) => {
  const futureTimestamp = new Date().getTime() + timer * 60000;
  const futureDate = new Date(futureTimestamp);
  let formattedTime = futureDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (options.reade) {
    const lastDate = new Date(options.reade);
    formattedTime += `  save time: `;
    formattedTime += lastDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  timerValue.textContent = formattedTime;
};

// run fn
await loadDataFromStorage();
populateVoiceList();

// Initialize the form with the user's option settings
async function loadDataFromStorage() {
  const data = await chrome.storage.sync.get("options");
  Object.assign(options, data.options);

  console.log(options);

  optionsForm.contentDivElem.value = options.contentDivElem;
  optionsForm.nextPage.value = options.nextPage;
  optionsForm.rate.value = options.rate;
  optionsForm.pitch.value = options.pitch;
  optionsForm.timer.value = options.timer;

  btnBook.innerText = options.book ? options.book : "books";
  btnBook.href = options.bookURL;

  getTimeFormat(options.timer, timerValue);

  pitchValue.textContent = pitch.value;
  rateValue.textContent = rate.value;
}

// get language
function populateVoiceList() {
  let voices = synth.getVoices().sort(function (a, b) {
    const alang = a.lang.toUpperCase();
    const blang = b.lang.toUpperCase();

    if (alang < blang) {
      return -1;
    } else if (alang == blang) {
      return 0;
    } else {
      return +1;
    }
  });

  let selectedIndex = 0;
  voiceSelect.innerHTML = "";
  for (let i = 0; i < voices.length; i++) {
    const option = document.createElement("option");
    option.textContent = `(${voices[i].lang}) ${voices[i].name} `;

    if (voices[i].default) {
      option.textContent += " -- DEFAULT";
    }

    option.setAttribute("data-lang", voices[i].lang);
    option.setAttribute("data-name", voices[i].name);

    voiceSelect.appendChild(option);
    if (voices[i].name === options.language) {
      console.log(voices[i].name, options.language);
      selectedIndex = i;
    }
  }

  voiceSelect.selectedIndex = selectedIndex;
}
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}
// Immediately persist options changes
optionsForm.addEventListener("change", () => {
  options.contentDivElem = optionsForm.contentDivElem.value;
  options.nextPage = optionsForm.nextPage.value;
  options.rate = Number(optionsForm.rate.value);
  options.pitch = Number(optionsForm.pitch.value);
  options.timer = Number(optionsForm.timer.value);
  options.language = voiceSelect.selectedOptions[0].getAttribute("data-name");

  pitchValue.textContent = options.pitch;
  rateValue.textContent = options.rate;

  getTimeFormat(options.timer, timerValue);

  chrome.storage.sync.set({ options });
  console.log(options);
});
