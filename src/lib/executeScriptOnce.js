import { getCurrentTab } from "../utils/getCurrentTab";
import { getBookUrl, setNewHistory, setReadingList } from "../utils/history";

export async function executeScriptOnce({
  sendMessage = false,
  scriptExecutionState,
  updateState,
  nextPage,
}) {
  try {
    const tab = await getCurrentTab();
    const url = tab?.url || tab.pendingUrl;
    const book = getBookUrl(url);
    const pageKey = tab.id;

    const action = sendMessage ? "startReadeFun" : "startReadeNextPage";

    // Check if we are on a different book
    if (!sendMessage && !url.includes(nextPage)) {
      if (
        scriptExecutionState.book.split("/").length + 1 >
          url.split("/").length ||
        (!url.startsWith(scriptExecutionState.book) && !sendMessage)
      ) {
        updateState({ book: "", isActive: null });

        console.log("Different book, stop execution");
        return false;
      }
    }

    // If the script is already active on this page, just send a message
    // in popup or command case upload page or if was stoped, start again
    try {
      await chrome.tabs.sendMessage(tab.id, { action: "isReaderActive" });
      setNewHistory(tab.title, url);
      updateState({ book, isActive: pageKey });

      console.log("upload page or if was stoped, start again");
      return true;
    } catch (error) {
      // If sending message fails, we inject the script
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/js/script.js"],
    });

    updateState({ book, isActive: pageKey });

    chrome.tabs.sendMessage(tab.id, { action });

    setNewHistory(tab.title, url);

    await setReadingList({ title: tab.title, url });

    return true;
  } catch (error) {
    console.error("Error executing script:", error);
    return false;
  }
}
