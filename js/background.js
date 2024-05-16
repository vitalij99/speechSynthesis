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
      .then(() => {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "startReadeFun",
            });
          }
        );
      });
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
