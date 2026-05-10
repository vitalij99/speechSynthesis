import { getCurrentTab } from "../utils/getCurrentTab";
import { getBookUrl, setNewHistory, setReadingList } from "../utils/history";

export async function executeScriptOnce({
  sendMessage = false,
  scriptExecutionState,
  updateState,
  nextPage = false,
}) {
  try {
    const tab = await getCurrentTab();
    const url = tab?.url ?? tab?.pendingUrl;

    if (!url) {
      console.warn("executeScriptOnce: no URL available", { tab });
      return false;
    }

    const book = getBookUrl(url);
    const pageKey = tab.id;

    if (!nextPage && pageKey === scriptExecutionState.isActive) {
      // Stop if navigated to a different book
      if (!sendMessage && shouldStopExecution(url, scriptExecutionState)) {
        updateState({ book: "", isActive: null });
        console.log("Different book, stopping execution", { tab });
        return false;
      }
    }

    const action = sendMessage ? "startReadeFun" : "startReadeNextPage";

    // If the script is already active on this page, just send a message
    // in popup or command case upload page or if was stoped, start again
    const isAlreadyInjected = await isReaderActive(tab.id);

    if (isAlreadyInjected) {
      setNewHistory(tab.title, url);
      updateState({ book, isActive: pageKey });
      await setReadingList({ title: tab.title, url });
      console.log("upload page or if was stoped, start again");
      return true;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/js/script.js"],
    });

    updateState({ book, isActive: pageKey });
    setNewHistory(tab.title, url);

    await chrome.tabs.sendMessage(tab.id, { action });
    await setReadingList({ title: tab.title, url });

    return true;
  } catch (error) {
    console.error("executeScriptOnce failed:", error);
    return false;
  }
}

// --- helpers ---

function shouldStopExecution(url, scriptExecutionState) {
  const isDeeperPath =
    scriptExecutionState.book.split("/").length + 1 > url.split("/").length;
  const isDifferentBook = !url.startsWith(scriptExecutionState.book);

  return isDeeperPath || isDifferentBook;
}

async function isReaderActive(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: "isReaderActive" });
    return true;
  } catch {
    return false;
  }
}
