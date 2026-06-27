import { setStorage } from "../lib/storage";
import { getBookUrl, setNewHistory, setReadingList } from "../utils/history";
import { getCurrentTab } from "../utils/getCurrentTab";
import { executeScriptOnce } from "../lib/executeScriptOnce";

// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

let scriptExecutionState = { isActive: null, book: "start" };
let load = false;
let nextPage = false;

chrome.runtime.onStartup.addListener(loadState);
chrome.runtime.onInstalled.addListener(loadState);
loadState();

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "com-start") {
    console.log("Command received: ", command, scriptExecutionState);

    await executeScriptOnce({
      sendMessage: true,
      scriptExecutionState,
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
  const { action } = message;
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
});

chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
  // if (details.frameId === 0)
  //   console.log("webNavigation ", { details }, );
  if (
    !load &&
    scriptExecutionState.isActive === details.tabId &&
    details.frameId === 0
  ) {
    console.log("webNavigation onDOMContentLoaded", {
      details,
      scriptExecutionState,
    });
    await executeScriptOnce({
      sendMessage: false,
      scriptExecutionState,
      updateState,
      nextPage,
    });
    nextPage = false;
  }
});
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
      scriptExecutionState,
      updateState,
      nextPage,
    });
  }, delay);

  setTimeout(() => {
    load = false;
  }, 2000);
}
async function handleStopScript() {
  console.log(scriptExecutionState, `stopScript #${scriptExecutionState.book}`);

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
