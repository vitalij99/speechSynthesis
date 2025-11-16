// background.js

const scriptExecutionState = { isActive: "", reader: false, book: "" };

async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case "com-start":
      await executeScriptOnce(true);
      break;

    case "com-add-p":
      console.log(scriptExecutionState);
      adjustParagraphCount(true);
      break;

    case "com-rem-p":
      adjustParagraphCount(false);
      break;
  }
});

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "firstTimeScript") {
    await executeScriptOnce(true);
  } else if (message.action === "stopScript") {
    scriptExecutionState.reader = false;
    const tab = await getCurrentTab();
    await setReadingList(tab);
  }
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (
    scriptExecutionState.isActive === details.tabId &&
    details.frameId === 0
  ) {
    console.log("webNavigation onCompleted");
    await executeScriptOnce(false);
  }
});

async function executeScriptOnce(sendMessage = false) {
  try {
    const tab = await getCurrentTab();
    const book = getBookUrl(tab.url);
    const pageKey = tab.id;

    const action = sendMessage ? "startReadeFun" : "startReadeNextPage";

    if (
      scriptExecutionState.book.split("/").length + 1 >
        tab.url.split("/").length ||
      (!tab.url.startsWith(scriptExecutionState.book) && !sendMessage)
    ) {
      scriptExecutionState.reader = false;
      scriptExecutionState.isActive = null;
      scriptExecutionState.book = "";
      console.log("Different book, stop execution");
      return false;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { action });
      setNewHistory(tab.title, tab.url);
      scriptExecutionState.reader = true;
      console.log("upload page");
      return true;
    } catch (error) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["/js/script.js"],
      });

      scriptExecutionState.isActive = pageKey;
      scriptExecutionState.book = book;
    }

    chrome.tabs.sendMessage(tab.id, { action, value: book });

    setNewHistory(tab.title, tab.url);

    await setReadingList(tab);

    scriptExecutionState.reader = true;
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
  const history = (await getStorageData("history")) || [];

  const linkArray = link.split("/");
  const bookLink = linkArray.slice(0, linkArray.length - 1).join("/");

  const filteredHistory = history.filter((item) => item.bookLink !== bookLink);

  const shortName = name.length > 150 ? name.substring(0, 147) + "..." : name;

  const newHistory = {
    name: shortName,
    link,
    bookLink,
  };

  const updatedHistory = [newHistory, ...filteredHistory].slice(0, 20);

  await setStorageData("history", updatedHistory);
}
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log("Tab closed:", tabId, scriptExecutionState.isActive);
  if (scriptExecutionState.isActive === tabId) {
    scriptExecutionState.isActive = "";
  }
});
