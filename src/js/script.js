import {
  autoScrollToParagraph,
  startAutoScrollEvents,
} from "../lib/autoScroll.js";
import {
  clearParagraphStyle,
  initStyles,
  styleCurrentParagraph,
} from "../lib/paragraphStyle.js";
import { configureButtons, configureReload } from "../lib/configureButtons.js";
import {
  addParagraph,
  createHTMLButton,
  setStorageBook,
} from "../lib/createHtmlButton.js";
import { debounce } from "../utils/debounce.js";
import { findElementWithMostDirectParagraphs } from "../lib/findElementWithMostDirectParagraphs.js";
import {
  getHtmlElements,
  moveToNextPage,
  saveThisPage,
  setNextPage,
} from "../lib/pageNavigation.js";
import { initStorageRulesText, replaceText } from "../lib/replaceText.js";
import { resetReader } from "../lib/resetReader.js";
import { setVoice } from "../lib/setVoice.js";
import {
  getStorageData,
  navigator,
  options,
  setSaveData,
} from "../lib/storageContent.js";
import { checkChildrenVisibility, checkText } from "../lib/textCheck.js";
import { setStorageDate } from "../lib/setStorageDate.js";
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

  await createHTMLButton({ isReload: false, handleButtonClose });

  voices = synth.getVoices();

  synth.onvoiceschanged = () => {
    voices = synth.getVoices();
  };
  saveThisPage({ navigator });

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
  if (synth?.speaking) synth.cancel();

  clearParagraphStyle(textContainer, paragraf);
  paragraf = Number(inputParagraf.value);
  if (paragraf < 0) paragraf = 0;

  debouncedSpeak();
}

function handleStopClick(buttonStart) {
  reader = null;
  setSaveData({ reader });
  setStorageBook({ navigator, setSaveData });
  clearParagraphStyle(textContainer, paragraf);

  synth.cancel();
  if (buttonStart) {
    buttonStart.textContent = "Play";
  }
  paused = false;

  chrome.runtime.sendMessage({ action: "stopScript" });

  if (stopFirstClick) {
    stopFirstClick = false;

    handleStartReadFun();
  } else {
    stopFirstClick = true;
  }
}
function handleStartClick(buttonStart) {
  stopFirstClick = false;
  setStorageBook({ navigator, setSaveData });
  if (!synth.speaking) {
    setStorageDate({ options, setSaveData, reader });

    buttonStart.textContent = "Pause";
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
    console.error("synth.speaking");
    return;
  }

  if (
    paragraf >= textContainer.children.length - (options.lastParagraf || 0) &&
    options.timerCheckbox
  ) {
    if (
      navigator.thisPageSave &&
      !document.URL.startsWith(navigator.thisPageSave)
    ) {
      // if the current url did not reload to the same page, do not navigate to next page and reset paragraf to 0

      console.log("Already on a different page, not navigating to next page.", {
        currentPage: document.URL,
        savedPage: navigator.thisPageSave,
      });
      paragraf = 0;
      handleStartReadFun();
      return;
    } else {
      moveToNextPage({
        nextPageBtn: options.nextPageBtn,
      });
    }
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
      const repText = replaceText(paragrafText);

      utterThis = new SpeechSynthesisUtterance(repText);
      styleCurrentParagraph(textContainer, paragraf);
      autoScrollToParagraph({
        textContainer: textElement,
        isHandleParagraphChange: false,
      });

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
  await initStorageRulesText();
  await initStyles();
}

async function handleStartReadFun() {
  const url = document.URL;
  await initGetStorage();
  if (url !== navigator.thisPageSave) {
    paragraf = 0;
    setSaveData({ paragraf });
  }

  setStorageBookDataStart();
}
async function handleStartReadNextPage() {
  const url = document.URL;
  await initGetStorage();

  const dateSave = new Date(reader);
  const dateNow = new Date();

  if (reader && options?.timerCheckbox && dateSave > dateNow) {
    if (url !== navigator.thisPageSave) {
      paragraf = 0;

      navigator.wasSleep = null;

      setSaveData({ paragraf, navigator });
    }

    setTimeout(
      () => {
        startReade();
      },
      Number(options.timeout) ? Number(options.timeout) : 1000,
    );
  } else if (reader && options?.timerCheckbox) {
    await createHTMLButton({ isReload: true, handleButtonClose });
    paragraf = 0;

    navigator.wasSleep = { url: navigator.bookURL, name: navigator.book };
    setSaveData({ paragraf, navigator });

    configureReload(setStorageBookDataStart);
  }
}

function setStorageBookDataStart() {
  reader = setStorageDate({ options, setSaveData, reader });
  setStorageBook({ navigator, setSaveData });

  startReade();
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
  const { action } = message;

  switch (action) {
    case "startReadeFun":
      await handleStartReadFun();
      break;

    case "startReadeNextPage":
      await handleStartReadNextPage();
      break;

    case "goToNextPage":
      moveToNextPage({ nextPageBtn: options.nextPageBtn });
      break;
    case "isReaderActive":
      togleReaderOff();
      break;
  }
});
function togleReaderOff() {
  if (synth?.speaking) {
    handleStopClick();
    stopFirstClick = false;
  } else {
    stopFirstClick = false;
    handleStartReadFun();
  }
}
function handleButtonClose(shadowHost) {
  synth?.cancel();
  chrome.runtime.sendMessage({ action: "closeReader" });
  clearParagraphStyle(textContainer, paragraf);
  shadowHost.remove();
}
