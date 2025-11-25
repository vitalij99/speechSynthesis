//script.js
console.log("Script loaded");

let saveDataTimeout = null;
let lastData = null;
// storage keys - reader, navigator, mouse, options, paragraf
// ----------------------------------------
let reader = null;
let paragraf = 0;

const navigator = {
  nextPageSave: null,
  thisPageSave: null,
  bookURL: null,
  book: null,
};

const mouse = { x: 0, y: 0 };

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
// ----------------------------------------
let paused = false;
let saveStyledParagraf = null;
let timerId = null;
let timerCounter = { count: 0, paragraf: 0 };

async function startReade() {
  let textContainer = getHtmlElements(options.contentDivElem);

  if (!textContainer || textContainer.length <= 1) {
    textContainer = findElementWithMostDirectParagraphs();
  }

  if (!textContainer || textContainer.children.length <= 5) {
    console.error("No readable content found.");
    console.dir(textContainer);
    return;
  }
  const synth = window.speechSynthesis;
  createHTMLButton();
  configureButtons(textContainer, synth);
}

function setNextPage() {
  const nextPageButton = getHtmlElements(options.nextPageBtn);

  navigator.thisPageSave = document.URL;
  if (!nextPageButton) {
    setSaveData({ navigator });

    return;
  }
  navigator.nextPageSave = nextPageButton
    ? nextPageButton?.attributes?.href?.value
    : getNextPage();
  setSaveData({ navigator });
}

function getHtmlElements(selector) {
  try {
    return (
      selector
        .split("\n")
        .map((name) => {
          if (!name.trim()) return null;
          try {
            return document.querySelector(name);
          } catch {
            return null;
          }
        })
        .filter(Boolean)?.[0] || null
    );
  } catch {
    return null;
  }
}

function configureButtons(textContainer, synth) {
  const buttonStart = document.getElementById("start");
  const buttonStop = document.getElementById("stop");
  const inputParagraf = document.getElementById("inputParagrafs");
  const punktParagrafs = document.getElementById("paragrafs");

  buttonStart.textContent = !paused ? "Pause" : "Play";

  punktParagrafs.textContent = textContainer.children.length;
  inputParagraf.max = textContainer.children.length;
  inputParagraf.value = paragraf;

  let voices = synth.getVoices();

  synth.onvoiceschanged = () => {
    voices = synth.getVoices();
  };

  setNextPage();

  const debouncedSpeak = debounce(() => {
    if (synth.speaking) synth.cancel();
    speak();
  }, 300);

  function speak() {
    if (synth.speaking) {
      console.error("speechSynthesis.speaking");
      return;
    }

    if (
      paragraf >= textContainer.children.length - (options.lastParagraf || 0) &&
      options.timerCheckbox
    ) {
      moveToNextPage();
    }

    const textElement = textContainer.children[paragraf];

    const textContent = Array.from(textElement?.childNodes)
      .map((node) => node.textContent)
      .join("");

    const paragrafText = checkText(textContent);

    if (textElement.clientHeight < 8 || !paragrafText) {
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

        if (reader) {
          setSaveData({ paragraf });

          speak();
        }
      };

      utterThis.onerror = (event) => {
        if (event.error === "interrupted") return;
        console.error("SpeechSynthesisUtterance.onerror", event.error);
        timerCounter.count++;

        timerCounter.paragraf = paragraf;
        if (timerCounter.count >= 3 && timerCounter.paragraf === paragraf) {
          clearParagraphStyle(textContainer, paragraf);
          paragraf++;
          timerCounter.count = 0;
        }
        resetReader({ synth, textContainer, paragraf, speak });
      };

      setVoice(utterThis, voices);
      utterThis.pitch = options.utterThis.pitch;
      utterThis.rate = options.utterThis.rate;
      utterThis.volume = options.utterThis.volume;

      synth.speak(utterThis);
    }
  }

  const dateSave = new Date(reader);
  const dateNow = new Date();

  setTimeout(
    () => {
      if (reader && dateSave > dateNow) {
        setNextPage();
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
    paragraf = Number(inputParagraf.value);
    if (paragraf < 0) paragraf = 0;

    debouncedSpeak();
  };
}

function handleParagraphChange(isAdd) {
  const inputParagraf = document.getElementById("inputParagrafs");

  if (isAdd) {
    inputParagraf.value = Math.min(
      Number(inputParagraf.value) + 1,
      Number(inputParagraf.max)
    );
  } else {
    inputParagraf.value = Math.max(Number(inputParagraf.value) - 1, 0);
  }
  inputParagraf.onchange();
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
  reader = null;
  navigator.bookURL = document.URL;
  navigator.book =
    document.title.length > 150
      ? document.title.substring(0, 147) + "..."
      : document.title;
  clearParagraphStyle(textContainer, paragraf);

  synth.cancel();
  buttonStart.textContent = "Play";
  paused = false;

  setSaveData({ reader, navigator });

  chrome.runtime.sendMessage("stopScript");
}

function styleCurrentParagraph(container, index) {
  try {
    const paragraph = container.children[index];

    // Скляний ефект + авто контраст
    paragraph.style.backdropFilter = "blur(10px)";
    paragraph.style.background = "rgba(255, 255, 255, 0.15)";
    paragraph.style.filter = "invert(1)";
    paragraph.style.borderRadius = "6px";
    paragraph.style.outline = "2px solid rgba(0,0,0,0.9)";

    paragraph.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    console.error("Error styling paragraph:", error);
  }
}

function clearParagraphStyle(container, index) {
  try {
    container.children[index].style = "";
  } catch {
    return;
  }
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
      window.location.href = navigator.nextPageSave;
    }
  }, 1000);
}

function getStorageData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ["reader", "navigator", "mouse", "options", "paragraf"],
      (result) => {
        resolve(result);
      }
    );
  });
}

function createHTMLButton() {
  if (document.getElementById("floatingDiv")) return;

  const buttonStyle = `
    .floating-div {
      display: flex;
      position: fixed;
      top: ${mouse.y && mouse.y <= 100 ? mouse.y : 1}%;
      left: ${mouse.x && mouse.x <= 100 ? mouse.x : 1}%;
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
      color: #000;
    }
    .paragraph {
      margin: 0 0 0 -12px;
      color: #000;
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
      mouse.x = newX;
      mouse.y = newY;
      setSaveData({ mouse });
    }
  };
}

function findElementWithMostDirectParagraphs() {
  const allElements = document.querySelectorAll("body *");
  let maxCount = 0;
  let bestElement = null;

  for (let el of allElements) {
    let count = 0;

    for (let child of el.children) {
      if (child.tagName === "P" || child.tagName === "SPAN") {
        count++;
      }
    }

    if (count > maxCount) {
      maxCount = count;
      bestElement = el;
    }
  }

  return bestElement;
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

function setStorageDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + options.timer);
  reader = date.toString();
  setSaveData({ reader });
}

function setStorageBook() {
  navigator.bookURL = document.URL;
  navigator.book =
    document.title.length > 150
      ? document.title.substring(0, 147) + "..."
      : document.title;
  setSaveData({ navigator });
}

function checkText(str) {
  if (!str) return "";
  const regex = /[\p{L}\p{N}]/u;
  if (str && regex.test(str))
    return str.replace(/(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu, "");
}

function resetReader({ synth, textContainer, paragraf, speak }) {
  console.log("⏹ Озвучка зупинилася або нема нових слів.");

  if (!options.timerCheckbox || !reader) return;

  clearParagraphStyle(textContainer, paragraf);
  synth.cancel();

  if (!synth.speaking) {
    speak();
  }
}

function setSaveData(data) {
  lastData = {
    ...lastData,
    ...data,
  };

  if (saveDataTimeout) clearTimeout(saveDataTimeout);

  saveDataTimeout = setTimeout(() => {
    chrome.storage.sync.set(
      Object.fromEntries(
        Object.entries(lastData).filter(([_, v]) => v !== undefined)
      )
    );
    lastData = null;
    saveDataTimeout = null;
  }, 300);
}
chrome.runtime.onMessage.addListener(async (message) => {
  const { action, value } = message;

  switch (action) {
    case "startReadeFun":
      await handleStartReadFun();
      break;

    case "startReadeNextPage":
      await handleStartReadNextPage(value);
      break;

    case "objustParagraphs":
      if (value !== undefined) handleParagraphChange(value);
      break;
  }
});

async function initGetStorage() {
  const data = await getStorageData();

  if (data.reader !== undefined) reader = data.reader;
  if (data.paragraf !== undefined) paragraf = data.paragraf;
  if (data.navigator) Object.assign(navigator, data.navigator);
  if (data.mouse) Object.assign(mouse, data.mouse);
  if (data.options) Object.assign(options, data.options);
}

async function handleStartReadFun() {
  const url = document.URL;
  await initGetStorage();
  if (url !== navigator.thisPageSave) {
    paragraf = 0;
    setSaveData({ paragraf });
  }

  setStorageDate();
  setStorageBook();
  startReade();
}
async function handleStartReadNextPage(bookStart) {
  const url = document.URL;
  await initGetStorage();

  const dateSave = new Date(reader);
  const dateNow = new Date();
  const sameBook = url.includes(bookStart);

  if (reader && sameBook && options?.timerCheckbox && dateSave > dateNow) {
    if (url !== navigator.thisPageSave) {
      paragraf = 0;
    }

    startReade();
  }
}
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.reader) {
    reader = changes.reader.newValue;
  }
  if (changes.navigator) {
    Object.assign(navigator, changes.navigator.newValue);
  }
  if (changes.mouse) {
    Object.assign(mouse, changes.mouse.newValue);
  }
  if (changes.options) {
    Object.assign(options, changes.options.newValue);
  }
});
