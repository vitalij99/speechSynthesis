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

async function startReade() {
  const synth = window.speechSynthesis;

  const textConteiner = getHtmlElements(options.contentDivElem);

  if (!textConteiner || textConteiner.children.length === 0) {
    return;
  }

  createHTMLButton();

  const buttonStart = document.getElementById("start");
  const buttonStop = document.getElementById("stop");
  const inputParagraf = document.getElementById("inputParagrafs");
  const punktParagrafs = document.getElementById("paragrafs");

  punktParagrafs.textContent = textConteiner.children.length;

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

      const buttonNextPage = getHtmlElements(options.nextPage);
      if (buttonNextPage) {
        const uriNextPage = buttonNextPage.attributes.href.value;
        window.location.href = uriNextPage;
      }
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

function createHTMLButton() {
  function styled(strings, ...values) {
    return strings.reduce((acc, str, i) => {
      acc += str;
      if (i < values.length) {
        acc += values[i];
      }
      return acc;
    }, "");
  }

  const buttonStyle = styled`
   .floating-div {
    display:flex;
    position: fixed;
    top: 20px;
    right: 15px;   
    background-color: lightblue;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
  }
  .action-button {
    margin-right: 10px;
    padding: 8px 16px;
    background-color: #4caf50;
    border: none;
    color: white;
    border-radius: 5px;
    cursor: pointer;
  }
  .input-container  {
    display: flex;
    align-items: center;
    justify-content: center;  
    background-color: #fff;
    padding-right: 5px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    
  }
  .input-container input {
    border: none;
    padding: 5px;  
    width:55px;
    font-size: 16px;
    
  }
  .paragraph{
    margin-left: -12px;
  }
  .paragraph::before {
      content: "/";
      margin-left: 5px;
      margin-right: 5px;
      font-size: 20px;
      color: #777;
  }
   
`;

  const floatingDivHTML = `
    <div id="floatingDiv" class="floating-div">
      <div>
        <button id="start" class="action-button">Play</button>
        <button id="stop" class="action-button">Stop</button>
      </div>
      <div class="input-container">
        <input type="number" id="inputParagrafs" class="input-number" value="0">
        <p id="paragrafs" class="paragraph">0</p>
      </div>
    </div>
  `;

  const floatingDiv = document.createElement("div");
  floatingDiv.innerHTML = floatingDivHTML;

  const styleElement = document.createElement("style");
  styleElement.textContent = buttonStyle;
  document.body.appendChild(floatingDiv);
  document.head.appendChild(styleElement);
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let key in changes) {
    let storageChange = changes[key];
    Object.assign(options, storageChange.newValue);
  }
});
chrome.runtime.onMessage.addListener(async function (message) {
  if (message.action === "startReadeFun") {
    const date = new Date();

    date.setMinutes(date.getMinutes() + options.timer);
    options.reade = date + "";

    chrome.storage.sync.set({ options });
    startReade();
  }
});

// auto start open menu

(async () => {
  const data = await getStorageData();
  Object.assign(options, data);
  const dateSave = new Date(options.reade);
  const dateNow = new Date();
  console.log({ dateSave, dateNow, options });
  if (options && options.reade && dateSave > dateNow) {
    startReade();
  }
})();
