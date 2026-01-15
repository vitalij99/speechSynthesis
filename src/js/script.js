import {
  autoScrollToParagraph,
  startAutoScrollEvents,
} from "../lib/autoScroll.js";
import {
  clearParagraphStyle,
  styleCurrentParagraph,
} from "../lib/clearParagraphStyle.js";
import { configureButtons } from "../lib/configureButtons.js";
import {
  addParagraph,
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
import { setVoice } from "../lib/setVoice.js";
import {
  getStorageData,
  navigator,
  options,
  setSaveData,
} from "../lib/storageContent.js";
import { checkChildrenVisibility, checkText } from "../lib/textCheck.js";
//script.js
console.log("Script loaded");

let reader = null;
let paragraf = 0;

let paused = false;
let saveStyledParagraf = null;
let timerId = null;
let timerCounter = { count: 0, paragraf: 0 };

// read param
let textContainer = null;
let synth = null;
let voices = null;
let utterThis = null;
let stopFirstClick = false;

async function startReade() {
  textContainer = getHtmlElements(options.contentDivElem);

  if (!textContainer || textContainer.length <= 1) {
    textContainer = findElementWithMostDirectParagraphs();
  }

  if (!textContainer || textContainer.children.length <= 5) {
    console.error("No readable content found.");
    console.dir(textContainer);
    return;
  }
  synth = window.speechSynthesis;

  await createHTMLButton();

  voices = synth.getVoices();

  synth.onvoiceschanged = () => {
    voices = synth.getVoices();
  };

  setNextPage({ options, setSaveData, navigator });
  startAutoScrollEvents();
  configureButtons({
    textContainer,
    synth,
    paused,
    paragraf,
    speak,
    handleParagraphChange,
    handleStartClick,
    handleStopClick,
  });

  const dateSave = new Date(reader);
  const dateNow = new Date();

  setTimeout(() => {
    if (reader && dateSave > dateNow) {
      setNextPage({ options, setSaveData, navigator });
      speak();
    }
  }, 1000);
}

function handleParagraphChange(inputParagraf) {
  clearParagraphStyle(textContainer, paragraf);
  paragraf = Number(inputParagraf.value);
  if (paragraf < 0) paragraf = 0;
  if (synth.speaking) synth.cancel();
  debouncedSpeak();
}

function handleStopClick(buttonStart) {
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

  if (stopFirstClick) {
    stopFirstClick = false;

    handleStartReadFun();
  } else {
    stopFirstClick = true;
  }
}
function handleStartClick(buttonStart) {
  stopFirstClick = false;
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

const debouncedSpeak = debounce(() => {
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
    moveToNextPage({ navigator });
  } else {
    const textElement = textContainer.children[paragraf];

    const text = checkChildrenVisibility(textElement);

    if (text === null || text === undefined) {
      paragraf++;
      addParagraph(paragraf);

      speak();
      return;
    }

    const paragrafText = checkText(text);

    if (!paragrafText || paragrafText?.length === 0) {
      paragraf++;
      addParagraph(paragraf);
      speak();
    } else if (paragrafText !== "") {
      utterThis = new SpeechSynthesisUtterance(paragrafText);
      styleCurrentParagraph(textContainer, paragraf);
      autoScrollToParagraph(textContainer, paragraf);

      saveStyledParagraf = paragraf;

      utterThis.onend = () => {
        clearParagraphStyle(textContainer, saveStyledParagraf || paragraf);

        paragraf++;
        addParagraph(paragraf);

        if (reader) {
          setSaveData({ paragraf });

          if (synth.speaking) synth.cancel();

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
          clearParagraphStyle,
        });
      };

      utterThis.voice = setVoice(utterThis, voices, options.utterThis.language);
      utterThis.pitch = options.utterThis.pitch;
      utterThis.rate = options.utterThis.rate;
      utterThis.volume = options.utterThis.volume;

      synth.speak(utterThis);
    }
  }
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

    case "goToNextPage":
      moveToNextPage({ navigator });
      break;
  }
});
