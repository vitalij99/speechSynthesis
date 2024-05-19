// menu.js
const synth = window.speechSynthesis;
const voiceSelect = document.querySelector("select");
const menuForm = document.getElementById("menuForm");

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
  timerCheckbox: true,
};
const getTimeFormat = (timer, form) => {
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

  form.timerValue.value = formattedTime;
};

// run fn
await loadDataFromStorage();
populateVoiceList();

// Initialize the form with the user's option settings
async function loadDataFromStorage() {
  const data = await chrome.storage.sync.get("options");
  Object.assign(options, data.options);

  menuForm.rate.value = options.rate;
  menuForm.pitch.value = options.pitch;
  menuForm.timer.value = options.timer;
  menuForm.timerCheckbox.checked = options.timerCheckbox;

  menuForm.rateValue.value = Number(menuForm.rate.value);
  menuForm.pitchValue.value = Number(menuForm.pitch.value);

  menuForm.timer.disabled = !options.timerCheckbox;

  getTimeFormat(options.timer, menuForm);
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
menuForm.addEventListener("change", () => {
  options.rate = Number(menuForm.rate.value);
  options.pitch = Number(menuForm.pitch.value);
  options.timer = Number(menuForm.timer.value);
  options.timerCheckbox = menuForm.timerCheckbox.checked;
  options.language = voiceSelect.selectedOptions[0].getAttribute("data-name");

  menuForm.timer.disabled = !options.timerCheckbox;

  getTimeFormat(options.timer, menuForm);

  console.log(options);
  chrome.storage.sync.set({ options });
});

menuForm.addEventListener("input", (event) => {
  menuForm.rateValue.value = Number(menuForm.rate.value);
  menuForm.pitchValue.value = Number(menuForm.pitch.value);
});
console.dir(menuForm);
