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
      await chrome.storage.sync.set({ reader: false });

      updateState({ reader: false });
    } else {
      await executeScriptOnce(true);
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
    await executeScriptOnce(true);
  } else if (message.action === "stopScript") {
    console.log(
      scriptExecutionState,
      `stopScript #${scriptExecutionState.book}`
    );

    updateState({ reader: false });
    const tab = await getCurrentTab();
    await setReadingList(tab);
  }
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0)
    console.log("webNavigation ", { details, state: scriptExecutionState });
  if (
    scriptExecutionState.isActive === details.tabId &&
    details.frameId === 0
  ) {
    console.log("webNavigation onCompleted");
    await executeScriptOnce(false);
  }
});
chrome.tabs.onRemoved.addListener((tabId) => {
  if (scriptExecutionState.isActive === tabId) {
    updateState({ isActive: null });
  }
});

async function executeScriptOnce(sendMessage = false) {
  try {
    const tab = await getCurrentTab();
    const book = getBookUrl(tab.url);
    const pageKey = tab.id;

    const action = sendMessage ? "startReadeFun" : "startReadeNextPage";

    if (!tab.url.includes(nextPage)) {
      if (
        scriptExecutionState.book.split("/").length + 1 >
          tab.url.split("/").length ||
        (!tab.url.startsWith(scriptExecutionState.book) && !sendMessage)
      ) {
        updateState({ book: "", isActive: null, reader: false });

        console.log("Different book, stop execution");
        return false;
      }
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { action });
      setNewHistory(tab.title, tab.url);
      updateState({ reader: true });

      console.log("upload page");
      return true;
    } catch (error) {
      // If sending message fails, we inject the script
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/js/script.js"],
    });

    updateState({ book, isActive: pageKey, reader: true });

    chrome.tabs.sendMessage(tab.id, { action, value: book });

    setNewHistory(tab.title, tab.url);

    await setReadingList(tab);

    return true;
  } catch (error) {
    console.error("Error executing script:", error);
    return false;
  }
}

async function adjustParagraphCount(delta) {
  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, {
    action: "objustParagraphs",
    value: delta,
  });
}

function getBookUrl(urlPage) {
  const url = new URL(urlPage);

  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length > 1) {
    segments.pop();
  }

  const newPath = "/" + segments.join("/");

  return url.origin + newPath;
}

async function getFindBook(urlPage) {
  const items = await chrome.readingList.query({});

  if (items.length === 0) return;
  const currentUrlBook = getBookUrl(urlPage);

  for (const item of items) {
    if (item.url.includes(currentUrlBook)) {
      return item.url;
    }
  }
}

async function setReadingList(tab) {
  const readingListUrl = await getFindBook(tab.url);

  if (readingListUrl) {
    chrome.readingList.updateEntry({
      title: tab.title,
      url: readingListUrl,
      hasBeenRead: false,
    });
  } else {
    chrome.readingList.addEntry({
      title: tab.title,
      url: tab.url,
      hasBeenRead: false,
    });
  }
}
async function getStorageData(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result.history);
    });
  });
}
async function setStorageData(key, value) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, () => {
      resolve();
    });
  });
}

async function setNewHistory(name, link) {
  if (!link || !name) return;

  const MAX_NAME_LENGTH = 150;
  const HISTORY_LIMIT = 20;

  const history = (await getStorageData("history")) || [];

  const linkSegments = link.split("/");
  const bookLink = linkSegments.slice(0, linkSegments.length - 1).join("/");

  const shortName =
    name.length > MAX_NAME_LENGTH
      ? `${name.substring(0, MAX_NAME_LENGTH - 3)}...`
      : name;

  const filteredHistory = history.filter((item) => {
    if (!item) return false;

    const isDuplicate = item.name === shortName || item.bookLink === bookLink;

    return !isDuplicate;
  });

  const newHistoryItem = {
    name: shortName,
    link: link,
    bookLink: bookLink,
  };

  const updatedHistory = [newHistoryItem, ...filteredHistory].slice(
    0,
    HISTORY_LIMIT
  );

  await setStorageData("history", updatedHistory);
}

async function loadState() {
  const { scriptExecutionState: saved } = await chrome.storage.sync.get(
    "scriptExecutionState"
  );
  nextPage = await chrome.storage.sync
    .get("navigator")
    .then((res) => res.navigator?.nextPageSave);

  if (saved) Object.assign(scriptExecutionState, saved);
}

function updateState(updates) {
  Object.assign(scriptExecutionState, updates);
  saveState();
}
function saveState() {
  chrome.storage.sync.set({ scriptExecutionState });
}
async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
chrome.storage.onChanged.addListener((changes) => {
  if (changes.navigator) {
    if (changes.navigator.newValue.nextPageSave !== nextPage) {
      nextPage = changes.navigator.newValue.nextPageSave;
    }
  }
});
