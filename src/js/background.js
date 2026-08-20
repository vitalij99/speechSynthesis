import { setStorage } from "../lib/storage";
import { getBookUrl, setNewHistory, setReadingList } from "../utils/history";
import { getCurrentTab } from "../utils/getCurrentTab";
import { executeScriptOnce } from "../lib/executeScriptOnce";
import { consoleLog, getLogs } from "../lib/consoleLog";
import { truncateTitle } from "../utils/truncateTitle";

// background.js
chrome.runtime.onInstalled.addListener(() => {
  consoleLog("Extension installed");
});

let scriptExecutionState = { isActive: null, book: "start" };
let load = false;
let nextPage = false;

chrome.runtime.onStartup.addListener(loadState);
chrome.runtime.onInstalled.addListener(loadState);
loadState();

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "com-start") {
    consoleLog("Command received: ", command);

    await executeScriptOnce({
      sendMessage: true,
      updateState,
    });
  } else if (command === "com-add-p") {
    adjustParagraphCount(true);
  } else if (command === "com-rem-p") {
    adjustParagraphCount(false);
  } else if (command === "com-go-next-page") {
    const tab = await getCurrentTab();
    chrome.tabs.sendMessage(tab.id, {
      action: "goToNextPage",
    });
  }
});

chrome.runtime.onMessage.addListener(async (message) => {
  const { action, value } = message;
  console.log("message", message);

  if (action === "setBookToHistory") {
    return handleSetBookToHistory(value);
  }
  if (action === "firstTimeScript" || action === "autoStartLink") {
    return handleStartScript(action);
  }

  if (action === "stopScript") {
    return handleStopScript();
  }

  if (action === "closeReader") {
    return handleCloseReader();
  }

  if (action === "goToNextPage") {
    return handleNextPage();
  }
  if (action === "cheakReaderActiveBg") {
    return await isReaderActive();
  }
});

chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
  if (details.frameId !== 0) return;

  if (!load && scriptExecutionState.isActive === details.tabId) {
    consoleLog("webNavigation onDOMContentLoaded", {
      details,
      scriptExecutionState,
    });

    if (
      !nextPage &&
      shouldStopExecution(details.url, scriptExecutionState.book)
    ) {
      // Stop if navigated to a different book
      updateState({ book: "", isActive: null });
      consoleLog("Different book, stopping execution", details);
      return false;
    }

    await executeScriptOnce({
      sendMessage: false,
      updateState,
      details,
    });
    nextPage = false;
  }
});

// chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
//   console.log("SPA nav", details);
// });

chrome.tabs.onRemoved.addListener((tabId) => {
  if (scriptExecutionState.isActive === tabId) {
    updateState({ isActive: null });
  }
});

async function adjustParagraphCount(delta) {
  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, {
    action: "objustParagraphs",
    value: delta,
  });
}

async function loadState() {
  const { scriptExecutionState: saved } = await chrome.storage.sync.get(
    "scriptExecutionState",
  );

  if (saved) Object.assign(scriptExecutionState, saved);
  await getLogs();
}

function updateState(updates) {
  Object.assign(scriptExecutionState, updates);
  setStorage({ scriptExecutionState: scriptExecutionState });
}

async function handleStartScript(action) {
  load = true;

  const delay = action === "autoStartLink" ? 5000 : 1;

  setTimeout(async () => {
    await executeScriptOnce({
      sendMessage: true,
      updateState,
    });
  }, delay);

  setTimeout(() => {
    load = false;
  }, 2000);
}
async function handleStopScript() {
  consoleLog(`stopScript #${scriptExecutionState.book}`);
  setStorage({ reader: null });

  const tab = await getCurrentTab();
  await setReadingList(tab);
}
async function handleCloseReader() {
  updateState({ book: "", isActive: null });
  setStorage({ reader: null });
  const tab = await getCurrentTab();
  await setReadingList(tab);
}
function handleNextPage() {
  nextPage = true;
}
function handleSetBookToHistory(params) {
  const { url } = params;

  const title = truncateTitle(params.title);
  setNewHistory(title, url);
  setReadingList({ title, url });
}
function shouldStopExecution(url, book) {
  const isDeeperPath = book.split("/").length + 1 > url.split("/").length;
  const isDifferentBook = !url.startsWith(book);

  return isDeeperPath || isDifferentBook;
}
async function isReaderActive(value) {
  try {
    const result = await chrome.tabs.sendMessage(
      scriptExecutionState.isActive,
      {
        action: "isReaderActive",
        value,
      },
    );

    return result;
  } catch {
    return false;
  }
}
