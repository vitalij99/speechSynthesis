function createHTMLButton() {
  const floatingDiv = document.createElement("div");
  floatingDiv.id = "floatingDiv";
  floatingDiv.innerHTML = `
  <div  id="wrappAppReader" style="position:fixed; top:0; right:0; padding:20px">
      <button id="start" type="submit">Play</button>      
      <button id="stop" >Stop</button>
      <input type="number" min="0"  value="0"  id="inputParagraf" style="width:50px" />
      <p id="paragrafs"  style="width:40px;display:inline-block">0</p>
</div > `;

  document.body.appendChild(floatingDiv);
}
createHTMLButton();
const buttonStart = document.getElementById("start");
const buttonStop = document.getElementById("stop");
const inputParagraf = document.getElementById("inputParagraf");
const punktParagrafs = document.getElementById("paragrafs");
const wrappAppReader = document.getElementById("wrappAppReader");

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
    nextPage: data.nextPage ?? "nextchap",
    language: data.language ?? "Google español",
    pitch: Number(data.pitch) ?? 2,
    rate: Number(data.rate) ?? 2,
    reade: data.reade ?? false,
    timer: data.timer ?? 2,
    paragraf: data.paragraf ?? 0,
  };

  const textConteiner = document.getElementById(options.classDiv);
  if (!textConteiner || textConteiner.children.length === 0) {
    wrappAppReader.innerHTML = "";
    return;
  }
  punktParagrafs.textContent = textConteiner.children.length;

  const buttonNextPage = document.getElementsByClassName(options.nextPage);
  const uriNextPage = buttonNextPage[0].attributes.href.value;

  let paragraf = options.paragraf;
  const voices = synth.getVoices();
  inputParagraf.value = paragraf;

  function speak() {
    if (synth.speaking) {
      console.error("speechSynthesis.speaking");
      return;
    }

    const paragrafText = textConteiner.children[paragraf].innerText;

    if (
      paragrafText.search("https://t.me/novelfire") >= 0 ||
      paragraf >= textConteiner.children.length - 1
    ) {
      options.paragraf = 0;

      chrome.storage.sync.set({ options });

      window.location.href = uriNextPage;
    } else if (textConteiner.children[paragraf].clientHeight === 0) {
      paragraf++;
      inputParagraf.value = paragraf;
      speak();
    } else if (paragrafText !== "") {
      const utterThis = new SpeechSynthesisUtterance(paragrafText);

      textConteiner.children[paragraf].style.backgroundColor = "#ffcc00";
      textConteiner.children[paragraf].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      utterThis.onend = function () {
        textConteiner.children[paragraf].style = "";

        paragraf++;
        inputParagraf.value = paragraf;
        if (paragraf < textConteiner.children.length && options.reade) {
          speak();
        }
      };

      utterThis.onerror = function () {
        console.error("SpeechSynthesisUtterance.onerror");
        options.reade = false;
        options.paragraf = 0;
        chrome.storage.sync.set({ options });
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
  const date = Math.floor(new Date() / (1000 * 60 * 60));

  if (options.reade && options.reade - date >= 0) {
    speak();
  }

  buttonStart.onclick = function () {
    let date = new Date();
    date.setHours(date.getHours() + options.timer);
    options.reade = Math.floor(date / (1000 * 60 * 60));

    // add last book
    options.bookURL = document.URL;
    options.book =
      document.title.length > 150
        ? document.title.substring(0, 147) + "..."
        : document.title;

    speak();
    chrome.storage.sync.set({ options });
  };

  buttonStop.onclick = function () {
    options.reade = null;
    options.bookURL = document.URL;
    options.book =
      document.title.length > 150
        ? document.title.substring(0, 147) + "..."
        : document.title;
    options.paragraf = paragraf;

    chrome.storage.sync.set({ options });
  };
  inputParagraf.onchange = function () {
    paragraf = inputParagraf.value;
  };
}
