// background.js

async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };

  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
chrome.runtime.onMessage.addListener(async (message) => {
  if (message === "firstTimeScript") {
    const tab = await getCurrentTab();

    chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        files: ["/js/script.js"],
      })
      .then(async () => {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "startReadeFun",
            });
          }
        );

        await setReadingList(tab);
      });
  } else if (message === "stopScript") {
    const tab = await getCurrentTab();

    await setReadingList(tab);
  }
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) {
    const tab = await getCurrentTab();

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/js/script.js"],
    });
  }
});
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
