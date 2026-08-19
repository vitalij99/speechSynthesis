import { getCurrentTab } from "../utils/getCurrentTab";
import { getBookUrl, setNewHistory, setReadingList } from "../utils/history";
import { consoleLog } from "./consoleLog";

export async function executeScriptOnce({
  sendMessage = false,
  scriptExecutionState,
  updateState,
  nextPage = false,
  details,
}) {
  try {
    const tab = await getCurrentTab();
    const url = tab?.url ?? tab?.pendingUrl ?? (details ? details.url : null);
    const pageKey = tab?.id ?? (details ? details.tabId : null);

    if (!url) {
      consoleLog("executeScriptOnce: no URL available", {
        url,
        pageKey,
        details,
        tab,
      });
      return false;
    }

    const book = getBookUrl(url);

    if (!nextPage) {
      // Stop if navigated to a different book
      if (!sendMessage && shouldStopExecution(url, scriptExecutionState)) {
        updateState({ book: "", isActive: null });
        consoleLog("Different book, stopping execution", { tab, details });
        return false;
      }
    }

    // If the script is already active on this page, just send a message
    // in popup or command case upload page or if was stoped, start again
    const isAlreadyInjected = await isReaderActive(pageKey, sendMessage);

    updateState({ book, isActive: pageKey });

    if (isAlreadyInjected) {
      consoleLog("upload page or if was stoped, start again");
      return true;
    }

    await chrome.scripting.executeScript({
      target: { tabId: pageKey },
      files: ["/js/script.js"],
    });

    await chrome.tabs.sendMessage(pageKey, {
      action: sendMessage ? "startReadeFun" : "startReadeNextPage",
    });

    return true;
  } catch (error) {
    consoleLog({
      sendMessage,
      scriptExecutionState,
      updateState,
      nextPage,
      details,
    });
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

async function isReaderActive(tabId, sendMessage) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: sendMessage ? "togleReaderMessage" : "isReaderActive",
    });
    return true;
  } catch {
    return false;
  }
}
