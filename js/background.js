// background.js

async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };

  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case "com-start":
      startOrStopReadingMode();
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
  if (message === "firstTimeScript") {
    await startOrStopReadingMode();
  } else if (message === "stopScript") {
    const tab = await getCurrentTab();

    await setReadingList(tab);
  }
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) {
    const tab = await getCurrentTab();

    chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        files: ["/js/script.js"],
      })
      .then(() => {
        setNewHistory(tab.title, tab.url);
      });
  }
});

async function startOrStopReadingMode() {
  const tab = await getCurrentTab();

  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      files: ["/js/script.js"],
    })
    .then(() => {
      setNewHistory(tab.title, tab.url);
    })
    .then(async () => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "startReadeFun",
        });
      });

      await setReadingList(tab);
    });
}

async function adjustParagraphCount(delta) {
  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, {
    action: "objustParagraphs",
    value: delta,
  });
}

function getBookUrl(urlPage) {
  const numbers = [];

  for (let index = 1; index < urlPage.length; index++) {
    const element = urlPage[urlPage.length - index];
    if (!isNaN(element)) {
      numbers.unshift(element);
    } else {
      return urlPage.slice(0, urlPage.length - index + 1);
    }
  }

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
