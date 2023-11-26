console.log("hellos");

const floatingDiv = document.createElement("div");
floatingDiv.id = "floatingDiv";
floatingDiv.innerHTML = `<div><form>      <div>        <label for="rate">Rate</label
        ><input type="range" min="0.5" max="2" value="1" step="0.1" id="rate" />
        <div class="rate-value">1</div>
        <div class="clearfix"></div>
      </div>
      <div>
        <label for="pitch">Pitch</label
        ><input type="range" min="0" max="2" value="1" step="0.1" id="pitch" />
        <div class="pitch-value">1</div>
        <div class="clearfix"></div>
      </div>
      <select></select>    <div>
      <button id="start" type="submit">Play</button>
      </div>
      </form>
      <button id="stop" >Stop</button>
</div > `;
document.body.appendChild(floatingDiv);

function getStorageData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get("options", (result) => {
      resolve(result.options);
    });
  });
}
const data = getStorageData().then((data) => {
  console.log(data);
  return data;
});

const options = {
  classDiv: data.classDiv,
  rate: data.rate,
  pitch: data.pitch,
  classEnd: data.classEnd,
  language: data.language,
};

const synth = window.speechSynthesis;

const inputForm = document.querySelector("form");
const buttonStop = document.querySelector("#stop");
const textConteiner = document.querySelector(".content");
const voiceSelect = document.querySelector("select");

const pitch = document.querySelector("#pitch");
const pitchValue = document.querySelector(".pitch-value");
const rate = document.querySelector("#rate");
const rateValue = document.querySelector(".rate-value");

let paragraf = 0;
let voices = [];
let reade = false;

function populateVoiceList() {
  voices = synth.getVoices().sort(function (a, b) {
    const aname = a.name.toUpperCase();
    const bname = b.name.toUpperCase();

    if (aname < bname) {
      return -1;
    } else if (aname == bname) {
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

function speak() {
  if (synth.speaking) {
    console.error("speechSynthesis.speaking");
    return;
  }

  const paragrafText = textConteiner.children[paragraf].innerText;
  if (paragrafText !== "") {
    const utterThis = new SpeechSynthesisUtterance(paragrafText);

    textConteiner.children[paragraf].style.backgroundColor = "#ffcc00";

    utterThis.onend = function (event) {
      textConteiner.children[paragraf].style = "#ffcc00";
      paragraf++;
      if (paragraf < textConteiner.children.length && reade) {
        speak();
      }
    };

    utterThis.onerror = function (event) {
      console.error("SpeechSynthesisUtterance.onerror");
    };

    const selectedOption =
      voiceSelect.selectedOptions[0].getAttribute("data-name");

    for (let i = 0; i < voices.length; i++) {
      if (voices[i].name === selectedOption) {
        utterThis.voice = voices[i];
        break;
      }
    }
    utterThis.pitch = pitch.value;
    utterThis.rate = rate.value;
    synth.speak(utterThis);
  }
}

inputForm.onsubmit = function (event) {
  event.preventDefault();
  paragraf = 0;
  reade = true;

  speak();
};

console.dir(buttonStop);
buttonStop.onclick = function () {
  reade = false;
};
pitch.onchange = function () {
  pitchValue.textContent = pitch.value;
};

rate.onchange = function () {
  rateValue.textContent = rate.value;
};

voiceSelect.onchange = function () {
  speak();
};
