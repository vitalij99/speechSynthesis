import {
  autoScrollToParagraph,
  startAutoScrollEvents,
} from "../lib/autoScroll.js";
import { initStyles, styleCurrentParagraph } from "../lib/paragraphStyle.js";
import { configureButtons, configureReload } from "../lib/configureButtons.js";
import {
  addParagraph,
  createHTMLButton,
  setInputParagrafValue,
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

let timerCounter = { count: 0, paragraf: 0 };

// read param
let textContainer = null;
let synth = null;
let voices = null;
let utterThis = null;
let stopFirstClick = false;

// checkSpeaking
let timerSpeakingTime = null;
let checkSpeakingTimer = null;

let chunkRanges = [];
let chunkSize = 1;
let activeIndex = null;

async function startReade() {
  try {
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

    startWatchdog();

    const value = { title: document.title, url: document.URL };

    chrome.runtime.sendMessage({ action: "setBookToHistory", value });
  } catch (error) {
    console.error(error.message);
    console.log(error);
  }
}

function handleParagraphChange(inputParagraf) {
  if (synth?.speaking) synth.cancel();

  clearChunkStyle();
  paragraf = Number(inputParagraf.value);
  if (paragraf < 0) paragraf = 0;

  debouncedSpeak();
}

function handleStopClick(buttonStart) {
  reader = null;
  stopWatchdog();
  setSaveData({ reader });
  setStorageBook({ navigator, setSaveData });
  clearChunkStyle();

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

    startWatchdog();
  } else if (paused) {
    paused = false;
    synth.resume();

    buttonStart.textContent = "Pause";

    startWatchdog();
  } else {
    paused = true;
    synth.pause();
    buttonStart.textContent = "Play";

    stopWatchdog();
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
      console.log("Already on a different page, not navigating to next page.", {
        currentPage: document.URL,
        savedPage: navigator.thisPageSave,
      });
      paragraf = 0;
      handleStartReadFun();
      return;
    } else {
      moveToNextPage({ nextPageBtn: options.nextPageBtn });
    }
    return;
  }

  const textElement = textContainer.children[paragraf];
  if (!textElement) return;

  const chunk = buildChunk(paragraf);

  if (!chunk.text) {
    paragraf += Math.max(chunk.count, 1);
    addParagraph(paragraf);
    speak();
    return;
  }

  chunkSize = chunk.count;
  chunkRanges = chunk.ranges;

  utterThis = new SpeechSynthesisUtterance(chunk.text);

  setActiveParagraph(chunkRanges[0].index);

  timerSpeakingTime = Date.now();

  utterThis.addEventListener("boundary", () => {
    if (!synth.speaking) return;
    timerSpeakingTime = Date.now();

    const idx = findParagraphByChar(event.charIndex);
    if (idx !== null) setActiveParagraph(idx);
  });

  utterThis.onend = () => {
    clearChunkStyle();
    timerSpeakingTime = null;

    paragraf++;
    addParagraph(paragraf);

    if (reader) {
      setSaveData({ paragraf });
      if (synth.speaking) synth.cancel();
      speak();
    }
  };

  utterThis.onerror = (event) => {
    console.log("SpeechSynthesisUtterance", event.error);
    if (event.error === "interrupted") return;
    if (event.error === "not-allowed") return;
    timerCounter.count++;

    timerCounter.paragraf = paragraf;
    if (timerCounter.count >= 3 && timerCounter.paragraf === paragraf) {
      clearChunkStyle();
      paragraf += chunkSize;
      timerCounter.count = 0;
    }
    resetReader();
  };

  utterThis.voice = setVoice(utterThis, voices, options.utterThis.language);
  utterThis.pitch = options.utterThis.pitch;
  utterThis.rate = options.utterThis.rate;
  utterThis.volume = options.utterThis.volume;

  synth.speak(utterThis);
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
  console.log("handleStartReadFun called");
  const url = document.URL;
  await initGetStorage();
  if (url !== navigator.thisPageSave) {
    paragraf = 0;
    setSaveData({ paragraf });
  }

  setStorageBookDataStart();
}
async function handleStartReadNextPage() {
  console.log("handleStartReadNextPage called");
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

    // is reload start create btn
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

function togleReaderOff() {
  console.log("togleReaderOff called", synth);

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
  clearChunkStyle();
  shadowHost.remove();
}

function startWatchdog() {
  stopWatchdog();

  checkSpeakingTimer = setInterval(() => {
    if (!synth.speaking) return;
    if (!timerSpeakingTime || synth.paused) return;

    if (Date.now() - timerSpeakingTime > 3000) {
      console.log("Читання, можливо, зупинилось/зависло");

      resetReader();

      stopWatchdog();
    }
  }, 3000);
}

function stopWatchdog() {
  if (checkSpeakingTimer) {
    clearInterval(checkSpeakingTimer);
    checkSpeakingTimer = null;
  }
}
function resetReader() {
  console.log("⏹ Озвучка зупинилася або нема нових слів. resetReader");

  if (!options.timerCheckbox || !reader) return;

  clearChunkStyle();
  synth.cancel();

  if (!synth.speaking) {
    speak();
  }
}

function clearChunkStyle() {
  try {
    if (activeIndex !== null) {
      textContainer.children[activeIndex].style = "";
    }
    activeIndex = null;
  } catch (error) {
    console.error("Error clearing chunk styles:", error);
  }

  chunkRanges = [];
}

function setActiveParagraph(i) {
  if (activeIndex === i) return;

  if (activeIndex !== null) {
    textContainer.children[activeIndex].style = "";
  }
  activeIndex = i;
  paragraf = i;
  setInputParagrafValue(paragraf);

  styleCurrentParagraph(textContainer, i);
  autoScrollToParagraph({
    textContainer: textContainer.children[i],
    isHandleParagraphChange: false,
  });

  if (
    paragraf >= textContainer.children.length - (options.lastParagraf || 0) &&
    options.timerCheckbox
  ) {
    moveToNextPage({ nextPageBtn: options.nextPageBtn });
  }
}
function findParagraphByChar(charIndex) {
  for (let k = chunkRanges.length - 1; k >= 0; k--) {
    if (charIndex >= chunkRanges[k].start) return chunkRanges[k].index;
  }
  return chunkRanges[0]?.index ?? null;
}

function buildChunk(start) {
  const maxChars = options.maxChunkChars || 500;
  const total = textContainer.children.length;
  const limit = total - (options.lastParagraf || 0);

  let text = "";
  const ranges = [];
  let count = 0;

  for (let i = start; i < limit; i++) {
    const raw = checkChildrenVisibility(textContainer.children[i]);
    const clean = raw == null ? "" : checkText(raw);
    count++;

    if (!clean) continue;

    let t = replaceText(clean).trim();

    if (!/[.!?…:;»"”)]$/.test(t)) t += ".";

    if (ranges.length && text.length + 1 + t.length > maxChars) {
      count--;
      break;
    }

    const from = text.length ? text.length + 1 : 0;
    text = text ? text + " " + t : t;
    ranges.push({ index: i, start: from, end: text.length });

    if (text.length >= maxChars) break;
  }

  return { text, count, ranges };
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
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
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
    case "togleReaderMessage":
      togleReaderOff();
      break;
    case "isReaderActive":
      sendResponse(synth?.speaking);
      break;
  }
});
