import {
  clearParagraphStyle,
  styleCurrentParagraph,
} from "../lib/clearParagraphStyle.js";
import {
  createHTMLButton,
  setStorageBook,
  setStorageDate,
} from "../lib/createHtmlButton.js";
import { debounce } from "../lib/debounce.js";
import { findElementWithMostDirectParagraphs } from "../lib/findElementWithMostDirectParagraphs.js";
import {
  getHtmlElements,
  moveToNextPage,
  setNextPage,
} from "../lib/pageNavigation.js";
import { resetReader } from "../lib/resetReader.js";
import { navigator, options, setSaveData } from "../lib/storageContent.js";
//script.js
console.log("Script loaded");

let reader = null;
let paragraf = 0;

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

  await createHTMLButton();
  configureButtons(textContainer, synth);
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

  setNextPage({ options, setSaveData, navigator });

  const debouncedSpeak = debounce(() => {
    if (synth.speaking) synth.cancel();
    speak();
  }, 300);

  const dateSave = new Date(reader);
  const dateNow = new Date();

  setTimeout(() => {
    if (reader && dateSave > dateNow) {
      setNextPage({ options, setSaveData, navigator });
      speak();
    }
  }, 1000);

  buttonStart.onclick = () => handleStartClick(synth, buttonStart, speak);
  buttonStop.onclick = () =>
    handleStopClick(synth, buttonStart, textContainer, paragraf);

  inputParagraf.onchange = () => {
    clearParagraphStyle(textContainer, paragraf);
    paragraf = Number(inputParagraf.value);
    if (paragraf < 0) paragraf = 0;

    debouncedSpeak();
  };

  function speak() {
    if (synth.speaking) {
      console.error("speechSynthesis.speaking");
      return;
    }

    if (
      paragraf >= textContainer.children.length - (options.lastParagraf || 0) &&
      options.timerCheckbox
    ) {
      moveToNextPage({ navigator });
    } else {
      const textElement = textContainer.children[paragraf];

      const text = checkChildrenVisibility(textElement);

      if (text === null || text === undefined) {
        paragraf++;
        inputParagraf.value = paragraf;

        speak();
        return;
      }

      const paragrafText = checkText(text);

      if (!paragrafText || paragrafText?.length === 0) {
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
          if (event.error === "not-allowed") return;
          console.error("SpeechSynthesisUtterance.onerror", event.error);
          timerCounter.count++;

          timerCounter.paragraf = paragraf;
          if (timerCounter.count >= 3 && timerCounter.paragraf === paragraf) {
            clearParagraphStyle(textContainer, paragraf);

            paragraf++;
            timerCounter.count = 0;
          }
          resetReader({
            synth,
            textContainer,
            paragraf,
            speak,
            options,
            reader,
          });
        };

        setVoice(utterThis, voices);
        utterThis.pitch = options.utterThis.pitch;
        utterThis.rate = options.utterThis.rate;
        utterThis.volume = options.utterThis.volume;

        synth.speak(utterThis);
      }
    }
  }
}
function handleStartClick(synth, buttonStart, speak) {
  if (!synth.speaking) {
    setStorageDate({ options, setSaveData, reader });

    setStorageBook({ navigator, setSaveData });
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

function setVoice(utterThis, voices) {
  if (!options.utterThis.language) return;
  for (const voice of voices) {
    if (voice.name === options.utterThis.language) {
      utterThis.voice = voice;
      break;
    }
  }
}

function getStorageData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ["reader", "navigator", "options", "paragraf"],
      (result) => {
        resolve(result);
      }
    );
  });
}

function checkText(str) {
  if (!str) return "";
  const regex = /[\p{L}\p{N}]/u;
  if (str && regex.test(str))
    return str.replace(/(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu, "");
}

function checkChildrenVisibility(textElement) {
  if (!textElement) return null;

  const results = [];

  const children = Array.from(textElement.childNodes);

  children.forEach((node) => {
    const text = node.textContent?.trim();
    if (!text) return;

    let rect = null;

    try {
      if (node.nodeType === Node.ELEMENT_NODE) {
        rect = node.getBoundingClientRect();
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.selectNodeContents(node);
        rect = range.getBoundingClientRect();
      }

      if (!rect) return;

      const isVisible = rect.height > 1 && rect.width > 0;

      if (isVisible) {
        results.push(text);
      } else {
        console.log("Hidden text node:", text);
      }
    } catch (error) {
      console.error("Error checking children visibility:", error);
    }
  });

  return results.length ? results.join(", ") : null;
}

async function initGetStorage() {
  const data = await getStorageData();

  if (data.reader !== undefined) reader = data.reader;
  if (data.paragraf !== undefined) paragraf = data.paragraf;
  if (data.navigator) Object.assign(navigator, data.navigator);

  if (data.options) Object.assign(options, data.options);
}

async function handleStartReadFun() {
  const url = document.URL;
  await initGetStorage();
  if (url !== navigator.thisPageSave) {
    paragraf = 0;
    setSaveData({ paragraf });
  }

  reader = setStorageDate({ options, setSaveData, reader });
  setStorageBook({ navigator, setSaveData });
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

    setTimeout(
      () => {
        startReade();
      },
      Number(options.timeout) ? Number(options.timeout) : 1000
    );
  }
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.reader) {
    reader = changes.reader.newValue;
  }
  if (changes.navigator) {
    Object.assign(navigator, changes.navigator.newValue);
  }

  if (changes.options) {
    Object.assign(options, changes.options.newValue);
  }
});
chrome.runtime.onMessage.addListener(async (message) => {
  const { action, value } = message;

  switch (action) {
    case "startReadeFun":
      await handleStartReadFun();
      break;

    case "startReadeNextPage":
      await handleStartReadNextPage(value);
      break;
  }
});
