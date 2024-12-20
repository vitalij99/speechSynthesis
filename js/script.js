//script.js

const options = {
  reade: null,
  timer: 20,
  paragraf: 0,
  lastParagraf: 0,
  timerCheckbox: true,
  timeout: 2000,
  navigator: {
    nextPageBtn: ".nextchap",
    nextPageSave: null,
    thisPageSave: null,
    contentDivElem: "#content /n .cha-words ",
    bookURL: null,
    book: null,
  },
  utterThis: {
    language: null,
    pitch: 2,
    rate: 2,
    volume: 1,
  },
  mouse: { x: 0, y: 0 },
};

let paused = false;
let saveStyledParagraf = null;

async function startReade() {
  const textContainer = getHtmlElements(options.navigator.contentDivElem);
  if (!textContainer || textContainer.children.length <= 5) {
    console.error("No readable content found.");
    console.dir(textContainer);
    return;
  }
  const synth = window.speechSynthesis;
  createHTMLButton();
  configureButtons(textContainer, synth);
}

function configureButtons(textContainer, synth) {
  const buttonStart = document.getElementById("start");
  const buttonStop = document.getElementById("stop");
  const inputParagraf = document.getElementById("inputParagrafs");
  const punktParagrafs = document.getElementById("paragrafs");

  buttonStart.textContent = !paused ? "Pause" : "Play";

  let paragraf = options.paragraf;
  punktParagrafs.textContent = textContainer.children.length;
  inputParagraf.max = textContainer.children.length;
  inputParagraf.value = paragraf;

  let voices = synth.getVoices();

  synth.onvoiceschanged = (event) => {
    voices = synth.getVoices();
  };

  function speak() {
    if (synth.speaking) {
      console.error("speechSynthesis.speaking");
      return;
    }

    const textElement = textContainer.children[paragraf];

    const textContent = Array.from(textElement.childNodes)
      .map((node) => node.textContent)
      .join("");

    const paragrafText = checkText(textContent);

    setNextPage();

    if (
      paragraf >=
        textContainer.children.length - 1 - (options.lastParagraf || 0) &&
      options.timerCheckbox
    ) {
      moveToNextPage();
    } else if (textElement.clientHeight < 8 || !paragrafText) {
      paragraf++;
      inputParagraf.value = paragraf;
      speak();
    } else if (paragrafText !== "") {
      const utterThis = new SpeechSynthesisUtterance(paragrafText);
      styleCurrentParagraph(textContainer, paragraf);
      saveStyledParagraf = paragraf;

      utterThis.onend = () => {
        clearParagraphStyle(textContainer, saveStyledParagraf || paragraf);
        paragraf++;
        inputParagraf.value = paragraf;
        if (paragraf < textContainer.children.length && options.reade) {
          options.paragraf = paragraf;
          chrome.storage.sync.set({ options });
          speak();
        }
      };

      setVoice(utterThis, voices);
      utterThis.pitch = options.utterThis.pitch;
      utterThis.rate = options.utterThis.rate;
      utterThis.volume = options.utterThis.volume;

      synth.speak(utterThis);
    }
  }

  const dateSave = new Date(options.reade);
  const dateNow = new Date();

  setTimeout(
    () => {
      if (options.reade && dateSave > dateNow) {
        speak();
      }
    },
    Number(options.timeout) ? Number(options.timeout) : 1000
  );

  buttonStart.onclick = () => handleStartClick(synth, buttonStart, speak);
  buttonStop.onclick = () =>
    handleStopClick(synth, buttonStart, textContainer, paragraf);
  inputParagraf.onchange = () => {
    clearParagraphStyle(textContainer, paragraf);
    paragraf = inputParagraf.value;

    if (synth.speaking) {
      synth.cancel();
      speak();
    }
  };
}

function handleStartClick(synth, buttonStart, speak) {
  if (!synth.speaking) {
    setStorageDate();

    setStorageBook();
    speak();
  } else if (paused) {
    paused = false;
    synth.resume();
    buttonStart.textContent = "Pause";
  } else {
    paused = true;
    synth.pause();
    buttonStart.textContent = "Play";
  }
}

function handleStopClick(synth, buttonStart, textContainer, paragraf) {
  options.reade = null;
  options.navigator.bookURL = document.URL;
  options.navigator.book =
    document.title.length > 150
      ? document.title.substring(0, 147) + "..."
      : document.title;
  clearParagraphStyle(textContainer, paragraf);
  options.paragraf = paragraf;
  synth.cancel();
  buttonStart.textContent = "Play";
  paused = false;
  chrome.storage.sync.set({ options });
  chrome.runtime.sendMessage("stopScript");
}

function styleCurrentParagraph(container, index) {
  const paragraph = container.children[index];
  paragraph.style.backdropFilter = "blur(10px)";
  paragraph.style.filter = "invert(1)";
  paragraph.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearParagraphStyle(container, index) {
  container.children[index].style = "";
}

function setVoice(utterThis, voices) {
  if (!options.utterThis.language) return;
  for (const voice of voices) {
    if (voice.name === options.utterThis.language) {
      utterThis.voice = voice;
      break;
    }
  }
}

function moveToNextPage() {
  const initialURL = window.location.href;
  const params = {
    key: "ArrowRight",
    code: "ArrowRight",
    keyCode: 39,
    which: 39,
    bubbles: true,
  };
  const rightArrowEvent = new KeyboardEvent("keydown", params);
  const rightArrowEventUp = new KeyboardEvent("keyup", params);

  window.dispatchEvent(rightArrowEvent);
  window.dispatchEvent(rightArrowEventUp);

  setTimeout(() => {
    if (window.location.href === initialURL) {
      window.location.href = options.navigator.nextPageSave;
    }
  }, 1000);
}

function setNextPage() {
  const nextPageButton = getHtmlElements(options.navigator.nextPageBtn, true);
  options.navigator.nextPageSave = nextPageButton
    ? nextPageButton.attributes.href.value
    : getNextPage();
  options.navigator.thisPageSave = document.URL;
  chrome.storage.sync.set({ options });
}

function getHtmlElements(selector, nextPage = false) {
  try {
    const elements = selector
      .split("\n")
      .map((name) => name && document.querySelector(name))
      .filter(Boolean);
    return elements.length > 0
      ? elements[0]
      : nextPage
      ? null
      : findElementWithMostDirectParagraphs();
  } catch (error) {
    return nextPage ? null : findElementWithMostDirectParagraphs();
  }
}

function getStorageData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get("options", (result) => resolve(result.options));
  });
}

function createHTMLButton() {
  if (document.getElementById("floatingDiv")) return;

  const buttonStyle = `
    .floating-div {
      display: flex;
      position: fixed;
      top: ${options.mouse.y && options.mouse.y <= 100 ? options.mouse.y : 1}%;
      left: ${options.mouse.x && options.mouse.x <= 100 ? options.mouse.x : 1}%;
      width: max-content;
      background-color: lightblue;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
      z-index: 999;
    
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
    .input-container {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color
      : #fff;
      padding-right: 5px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .input-container input {
      border: none;
      padding: 5px;
      width: 55px;
      font-size: 16px;
    }
    .paragraph {
      margin: 0 0 0 -12px;
    }
    .paragraph::before {
      content: "/";
      margin-left: 5px;
      margin-right: 5px;
      font-size: 20px;
      color: #777;
    }

    #draggable {
      user-select: none;    
    }
    .no-select {
      user-select: none; 
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      }
  `;

  const floatingDivHTML = `
    <div id="floatingDiv" class="floating-div">
      <div>
        <button id="start" class="action-button">Play</button>
        <button id="stop" class="action-button">Stop</button>
      </div>
      <div class="input-container">
        <input type="number" id="inputParagrafs" class="input-number" value="0" min="0" max="7777">
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

  const draggableElement = document.getElementById("floatingDiv");

  let isDragging = false;
  let startX, startY, initialX, initialY, newX, newY;

  draggableElement.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = (draggableElement.offsetLeft / window.innerWidth) * 100;
    initialY = (draggableElement.offsetTop / window.innerHeight) * 100;

    document.body.classList.add("no-select");

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  const onMouseMove = (e) => {
    if (!isDragging) return;

    const dx = ((e.clientX - startX) / window.innerWidth) * 100;
    const dy = ((e.clientY - startY) / window.innerHeight) * 100;

    newX = (initialX + dx).toFixed(2);
    newY = (initialY + dy).toFixed(2);

    const elementWidth =
      (draggableElement.offsetWidth / window.innerWidth) * 100;
    const elementHeight =
      (draggableElement.offsetHeight / window.innerHeight) * 100;

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + elementWidth > 100) newX = 100 - elementWidth;
    if (newY + elementHeight > 100) newY = 100 - elementHeight;

    draggableElement.style.left = `${newX}%`;
    draggableElement.style.top = `${newY}%`;
  };

  const onMouseUp = () => {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.classList.remove("no-select");

    if (newX && newY) {
      options.mouse.x = newX;
      options.mouse.y = newY;
      chrome.storage.sync.set({ options });
    }
  };
}

function findElementWithMostDirectParagraphs() {
  let elements = document.body.children;
  let maxParagraphs = 0;
  let elementWithMostParagraphs = null;

  for (let element of elements) {
    let paragraphs = element.querySelectorAll("div > p");

    if (paragraphs.length > maxParagraphs) {
      const parent =
        paragraphs[Math.floor(paragraphs.length / 2)].parentElement;
      const parentParagraphs = parent.getElementsByTagName("p");

      if (parentParagraphs.length > maxParagraphs) {
        maxParagraphs = parentParagraphs.length;
        elementWithMostParagraphs = parent;
      }
    }
  }

  return elementWithMostParagraphs;
}

function getNextPage() {
  const urlPage = document.URL;
  const numbers = [];

  for (let index = 1; index < urlPage.length; index++) {
    const element = urlPage[urlPage.length - index];
    if (!isNaN(element)) {
      numbers.unshift(element);
    } else if (index !== 1) {
      const newUrlPage = urlPage.slice(0, urlPage.length - index + 1);
      const number = parseInt(numbers.join("")) + 1;

      return newUrlPage + number;
    }
  }

  return urlPage;
}

const setStorageDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + options.timer);
  options.reade = date.toString();
  chrome.storage.sync.set({ options });
};

const setStorageBook = () => {
  options.navigator.bookURL = document.URL;
  options.navigator.book =
    document.title.length > 150
      ? document.title.substring(0, 147) + "..."
      : document.title;

  chrome.storage.sync.set({ options });
};

function checkText(str) {
  const regex = /[\p{L}\p{N}]/u;
  if (str && regex.test(str))
    return str.replace(/(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu, "");
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let key in changes) {
    let storageChange = changes[key];
    Object.assign(options, storageChange.newValue);
  }
});

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "startReadeFun") {
    const urlPage = document.URL;
    if (urlPage !== options.navigator.thisPageSave) {
      options.paragraf = 0;
      chrome.storage.sync.set({ options });
    }

    setStorageDate();
    setStorageBook();
    startReade();
  }
});

(async function autoStartOpenMenu() {
  const data = await getStorageData();
  Object.assign(options, data);
  const dateSave = new Date(options.reade);
  const dateNow = new Date();

  const urlPage = document.URL;

  if (
    options?.reade &&
    options?.timerCheckbox &&
    dateSave > dateNow &&
    (urlPage === options.navigator.nextPageSave ||
      urlPage === options.navigator.thisPageSave)
  ) {
    if (urlPage === options.navigator.nextPageSave) {
      options.paragraf = 0;
    }
    startReade();
  }
})();
