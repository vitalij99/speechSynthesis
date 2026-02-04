import { setStorage } from "../lib/storage";
import { getBookUrl, setNewHistory, setReadingList } from "../utils/history";
import { getCurrentTab } from "../utils/getCurrentTab";
import { executeScriptOnce } from "../lib/executeScriptOnce";

// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});
let nextPage = null;
let scriptExecutionState = { isActive: null, reader: false, book: "start" };

chrome.runtime.onStartup.addListener(loadState);
chrome.runtime.onInstalled.addListener(loadState);
loadState();

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "com-start") {
    console.log("Command received: ", command, scriptExecutionState);
    if (scriptExecutionState.reader) {
      console.log("Stopping reader");
      await chrome.storage.sync.set({ reader: false });

      updateState({ reader: false });
    } else {
      await executeScriptOnce({
        sendMessage: true,
        scriptExecutionState,
        updateState,
        nextPage,
      });
    }
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
  if (message.action === "firstTimeScript") {
    await executeScriptOnce({
      sendMessage: true,
      scriptExecutionState,
      updateState,
      nextPage,
    });
  } else if (message.action === "stopScript") {
    console.log(
      scriptExecutionState,
      `stopScript #${scriptExecutionState.book}`,
    );

    updateState({ reader: false });
    const tab = await getCurrentTab();
    await setReadingList(tab);
  }
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  // if (details.frameId === 0)
  //   console.log("webNavigation ", { details, state: scriptExecutionState });
  if (
    scriptExecutionState.isActive === details.tabId &&
    details.frameId === 0
  ) {
    console.log("webNavigation onCompleted");
    await executeScriptOnce({
      sendMessage: false,
      scriptExecutionState,
      updateState,
      nextPage,
    });
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
  nextPage = await chrome.storage.sync
    .get("navigator")
    .then((res) => res.navigator?.nextPageSave);

  if (saved) Object.assign(scriptExecutionState, saved);
}

function updateState(updates) {
  Object.assign(scriptExecutionState, updates);
  setStorage({ scriptExecutionState: scriptExecutionState });
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.navigator) {
    if (changes.navigator.newValue.nextPageSave !== nextPage) {
      nextPage = changes.navigator.newValue.nextPageSave;
    }
  }
});
