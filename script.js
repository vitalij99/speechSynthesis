const options = {
  contentDivElem: "#content",
  nextPage: ".nextchap",
  language: "Google español",
  pitch: 2,
  rate: 2,
  reade: false,
  timer: 20,
  paragraf: 0,
};

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

async function startReade() {
  const data = await getStorageData();
  Object.assign(options, data);

  const synth = window.speechSynthesis;

  const textConteiner = getHtmlElements(options.contentDivElem);

  if (!textConteiner || textConteiner.children.length === 0) {
    return;
  }
  createHTMLButton();

  const buttonStart = document.getElementById("start");
  const buttonStop = document.getElementById("stop");
  const inputParagraf = document.getElementById("inputParagraf");
  const punktParagrafs = document.getElementById("paragrafs");

  punktParagrafs.textContent = textConteiner.children.length;

  const buttonNextPage = getHtmlElements(options.nextPage);

  const uriNextPage = buttonNextPage.attributes.href.value;

  let paragraf = options.paragraf;
  const voices = synth.getVoices();
  inputParagraf.value = paragraf;

  function speak() {
    if (synth.speaking) {
      console.error("speechSynthesis.speaking");
      return;
    }

    const paragrafText = textConteiner.children[paragraf].innerText;
    // next page
    if (paragraf >= textConteiner.children.length - 1) {
      options.paragraf = 0;

      chrome.storage.sync.set({ options });

      window.location.href = uriNextPage;
    } else if (textConteiner.children[paragraf].clientHeight === 0) {
      paragraf++;
      inputParagraf.value = paragraf;
      speak();
    } else if (paragrafText !== "") {
      const utterThis = new SpeechSynthesisUtterance(paragrafText);

      textConteiner.children[paragraf].style.backdropFilter = "blur(10px)";
      textConteiner.children[paragraf].style.filter = "invert(1)";
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

  const dateSave = new Date(options.reade);
  const dateNow = new Date();

  setTimeout(() => {
    if (options.reade && dateSave > dateNow) {
      speak();
    }
  }, 1000);

  buttonStart.onclick = function () {
    const date = new Date();

    date.setMinutes(date.getMinutes() + options.timer);
    options.reade = date + "";

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
    textConteiner.children[paragraf].style = "";
    options.paragraf = paragraf;
    synth.cancel();

    chrome.storage.sync.set({ options });
  };
  inputParagraf.onchange = function () {
    paragraf = inputParagraf.value;
  };
}

function getHtmlElements(nameElements) {
  const foundElements = [];

  const massNameElements = nameElements.split("\n");

  if (massNameElements.length === 0)
    return document.querySelector(nameElements);

  for (const name of massNameElements) {
    if (name.length !== 0) {
      const element = document.querySelector(name);
      if (element) {
        foundElements.push(element);
      }
    }
  }

  return foundElements[0];
}
function getStorageData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get("options", (result) => {
      resolve(result.options);
    });
  });
}
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let key in changes) {
    let storageChange = changes[key];
    Object.assign(options, storageChange.newValue);
  }
});

startReade();
