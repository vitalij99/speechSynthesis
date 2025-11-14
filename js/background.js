// background.js

const scriptExecutionState = { isActive: "", reader: false };
let bookReader = "";

async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case "com-start":
      await executeScriptOnce();
      break;

    case "com-add-p":
      adjustParagraphCount(true);
      break;

    case "com-rem-p":
      adjustParagraphCount(false);
      break;
  }
});

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "firstTimeScript") {
    await executeScriptOnce();
  } else if (message.action === "stopScript") {
    scriptExecutionState.reader = false;
    const tab = await getCurrentTab();
    await setReadingList(tab);
  }
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) {
    await executeScriptWebNav();
  }
});

async function executeScriptWebNav() {
  const tab = await getCurrentTab();
  const pageKey = `${tab.id}-${tab.url}`;
  const isAlreadyActive = scriptExecutionState.isActive === pageKey;

  const action = "startReadeNextPage";

  console.log("executeScriptWebNav bk:", tab.url);
  console.log("isAlreadyActive pk:", isAlreadyActive);
  console.log("executeScriptWebNav sa:", scriptExecutionState);

  if (isAlreadyActive && scriptExecutionState.reader) {
    chrome.tabs.sendMessage(tab.id, { action, value: bookReader });
    setNewHistory(tab.title, tab.url);
    scriptExecutionState.reader = true;
    return false;
  }
}
async function executeScriptOnce() {
  const tab = await getCurrentTab();
  const pageKey = `${tab.id}-${tab.url}`;

  const action = "startReadeFun";

  console.log("execut bk:", tab.url);
  console.log("execut pk:", pageKey);

  if (scriptExecutionState.isActive !== pageKey) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/js/script.js"],
    });
  }

  chrome.tabs.sendMessage(tab.id, { action });
  scriptExecutionState.reader = true;
  scriptExecutionState.isActive = pageKey;

  bookReader = getBookUrl(tab.url);
  console.log("bookReader bk:", bookReader);

  await setNewHistory(tab.title, tab.url);

  await setReadingList(tab);

  return true;
}

chrome.tabs.onRemoved.addListener((tabId) => {
  if (scriptExecutionState.isActive.startsWith(`${tabId}-`)) {
    scriptExecutionState.isActive = "";
  }
});
async function adjustParagraphCount(delta) {
  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, {
    action: "objustParagraphs",
    value: delta,
  });
}

function getBookUrl(urlPage) {
  const urlParts = urlPage.split("/");

  const res = urlParts.slice(0, urlParts.length - 1).join("/");

  if (res.length > 0) {
    urlPage = res;
  }

  console.log("getBookUrl bk:", urlPage);

  return urlPage;
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
