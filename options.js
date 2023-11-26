// In-page cache of the user's options
const options = {
  classDiv: "content",
  classEnd: "end",
  rate: 1,
  pitch: 1,
  language: null,
};

const synth = window.speechSynthesis;
const voiceSelect = document.querySelector("select");
const optionsForm = document.getElementById("optionsForm");

const pitch = document.querySelector("#pitch");
const pitchValue = document.querySelector(".pitch-value");
const rate = document.querySelector("#rate");
const rateValue = document.querySelector(".rate-value");

// Immediately persist options changes
optionsForm.addEventListener("change", (event) => {
  options.classDiv = optionsForm.classDiv.value;
  options.classEnd = optionsForm.classEnd.value;
  options.rate = Number(optionsForm.rate.value);
  options.pitch = Number(optionsForm.pitch.value);
  options.language = voiceSelect.selectedOptions[0].getAttribute("data-name");

  chrome.storage.sync.set({ options });
  console.log(options);
});

// Initialize the form with the user's option settings
const data = await chrome.storage.sync.get("options");
Object.assign(options, data.options);

console.log(options);
optionsForm.classDiv.value = options.classDiv;
optionsForm.classEnd.value = options.classEnd;
optionsForm.rate.value = options.rate;
optionsForm.pitch.value = options.pitch;

let voices;
function populateVoiceList() {
  voices = synth.getVoices().sort(function (a, b) {
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
  const selectedIndex =
    voiceSelect.selectedIndex < 0 ? 0 : voiceSelect.selectedIndex;
  voiceSelect.innerHTML = "";

  for (let i = 0; i < voices.length; i++) {
    const option = document.createElement("option");
    option.textContent = `${voices[i].name} (${voices[i].lang})`;

    if (voices[i].default) {
      option.textContent += " -- DEFAULT";
    }

    option.setAttribute("data-lang", voices[i].lang);
    option.setAttribute("data-name", voices[i].name);
    voiceSelect.appendChild(option);
  }
  voiceSelect.selectedIndex = selectedIndex;
}
populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

pitchValue.textContent = pitch.value;
rateValue.textContent = rate.value;
pitch.onchange = function () {
  pitchValue.textContent = pitch.value;
};

rate.onchange = function () {
  rateValue.textContent = rate.value;
};
