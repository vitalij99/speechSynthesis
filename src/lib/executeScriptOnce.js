import { getCurrentTab } from "../utils/getCurrentTab";
import { getBookUrl, setNewHistory, setReadingList } from "../utils/history";

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
    const title = truncateTitle(
      tab?.title ?? (details ? scriptExecutionState.title : null),
    );

    if (!url || !title) {
      console.warn("executeScriptOnce: no URL available", {
        title,
        url,
        pageKey,
        details,
        tab,
      });
      return false;
    }

    const book = getBookUrl(url);

    if (!nextPage && pageKey === scriptExecutionState.isActive) {
      // Stop if navigated to a different book
      if (!sendMessage && shouldStopExecution(url, scriptExecutionState)) {
        updateState({ book: "", isActive: null, title: null });
        console.log("Different book, stopping execution", { tab, details });
        return false;
      }
    }

    // If the script is already active on this page, just send a message
    // in popup or command case upload page or if was stoped, start again
    const isAlreadyInjected = await isReaderActive(pageKey);

    updateState({ book, isActive: pageKey, title });
    setNewHistory(title, url);
    await setReadingList({ title, url });

    if (isAlreadyInjected) {
      console.log("upload page or if was stoped, start again");
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
    console.log({
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

async function isReaderActive(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: "isReaderActive" });
    return true;
  } catch {
    return false;
  }
}
function truncateTitle(title, maxLength = 150) {
  if (!title) return "";
  return title.length > maxLength
    ? `${title.substring(0, maxLength - 3)}...`
    : title;
}
