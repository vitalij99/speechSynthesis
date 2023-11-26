function createHTMLButton() {
  const floatingDiv = document.createElement("div");
  floatingDiv.id = "floatingDiv";
  floatingDiv.innerHTML = `<div>
      <button id="start" type="submit">Play</button>
      
      <button id="stop" >Stop</button>
      <input type="number"  value="0"  id="inputParagraf" />
</div > `;
  floatingDiv.style.position = "fixed";
  floatingDiv.style.top = "0";
  floatingDiv.style.right = "0";
  floatingDiv.style.padding = "20px";
  document.body.appendChild(floatingDiv);
}
createHTMLButton();
const buttonStart = document.getElementById("start");
const buttonStop = document.getElementById("stop");
const inputParagraf = document.getElementById("inputParagraf");
startReade();
async function startReade() {
  function getStorageData() {
    return new Promise((resolve) => {
      chrome.storage.sync.get("options", (result) => {
        resolve(result.options);
      });
    });
  }

  const data = await getStorageData();

  const synth = window.speechSynthesis;
  const options = {
    classDiv: data.classDiv ?? "content",
    classEnd: data.classEnd ?? "end",
    language: data.language ?? "Google español",
    pitch: Number(data.pitch),
    rate: Number(data.rate),
  };

  const textConteiner = document.getElementById(options.classDiv);

  let paragraf = 0;
  const voices = synth.getVoices();
  let reade = false;

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
        textConteiner.children[paragraf].style = "";
        textConteiner.children[paragraf].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        paragraf++;
        inputParagraf.value = paragraf;
        if (paragraf < textConteiner.children.length && reade) {
          speak();
        }
      };

      utterThis.onerror = function (event) {
        console.error("SpeechSynthesisUtterance.onerror");
      };

      for (let i = 0; i < voices.length; i++) {
        if (voices[i].name === options.language) {
          utterThis.voice = voices[i];
          break;
        }
      }
      utterThis.pitch = options.pitch;
      utterThis.rate = options.rate;
      synth.speak(utterThis);
    }
  }

  buttonStart.onclick = function (event) {
    reade = true;
    console.log(data);
    speak();
  };

  buttonStop.onclick = function () {
    reade = false;
  };
  inputParagraf.onchange = function () {
    paragraf = inputParagraf.value;
  };
}
