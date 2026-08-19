import { getCurrentTab } from "../utils/getCurrentTab";
import { getBookUrl, setNewHistory, setReadingList } from "../utils/history";
import { consoleLog } from "./consoleLog";

export async function executeScriptOnce({
  sendMessage = false,
  updateState,
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
      details,
    });
    console.error("executeScriptOnce failed:", error);
    return false;
  }
}

// --- helpers ---

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
