import { getStorage, setStorage } from "../lib/storage";

// popup.js
const btnStartReader = document.getElementById("startReader");
const historyMenu = document.getElementById("historyMenu");
const toggleBtn = document.getElementById("toggleHistory");

let reader = null;
let isInitialized = false;

function isReaderActive(reader) {
  if (!reader) return false;
  const savedDate = new Date(reader);
  const now = new Date();
  return savedDate > now;
}

function updateReaderButton(reader) {
  const isActive = isReaderActive(reader);
  btnStartReader.textContent = !!isActive ? "Stop" : "Play";
  btnStartReader.setAttribute("aria-pressed", isActive.toString());
}

function updateNavigatorLink(navigator) {
  const btnBook = document.querySelector(".book-popup");
  if (!btnBook) return;

  btnBook.textContent = navigator?.book || "Last started reader";
  btnBook.href = navigator?.bookURL || "#";

  if (!navigator?.bookURL) {
    btnBook.setAttribute("aria-disabled", "true");
    btnBook.style.pointerEvents = "none";
  }
}

async function loadHistory() {
  try {
    const { history = [] } = await getStorage("history");

    if (!history.length) {
      historyMenu.innerHTML =
        '<p class="empty-state">No reading history yet</p>';
      return;
    }

    historyMenu.innerHTML = history
      .map(
        (item) => `
        <a href="${escapeHtml(item.link)}" 
           target="_blank" 
           rel="noopener noreferrer"
           class="history-item">
          ${escapeHtml(item.name)}
        </a>
      `
      )
      .join("");
  } catch (error) {
    console.error("Failed to load history:", error);
    historyMenu.innerHTML = '<p class="error">Failed to load history</p>';
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function handleReaderToggle() {
  try {
    const isActive = isReaderActive(reader);

    if (isActive) {
      await chrome.runtime.sendMessage({ action: "stopScript" });
      reader = null;
      await setStorage({ reader });
    } else {
      await chrome.runtime.sendMessage({ action: "firstTimeScript" });
      window.close();
    }
  } catch (error) {
    console.error("Failed to toggle reader:", error);

    btnStartReader.textContent = "Error - Try again";
    setTimeout(() => updateReaderButton(reader), 2000);
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;

  if (changes.reader) {
    reader = changes.reader.newValue;
    updateReaderButton(reader);
  }

  if (changes.navigator) {
    updateNavigatorLink(changes.navigator.newValue);
  }

  if (changes.history && !historyMenu.classList.contains("hidden")) {
    loadHistory();
  }
});

async function init() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const { reader: storedReader, navigator } = await getStorage([
      "reader",
      "navigator",
    ]);

    reader = storedReader;
    updateReaderButton(reader);
    updateNavigatorLink(navigator);

    btnStartReader.addEventListener("click", handleReaderToggle);

    toggleBtn.addEventListener("click", async () => {
      const isHidden = historyMenu.classList.contains("hidden");

      if (isHidden) {
        await loadHistory();
        historyMenu.classList.remove("hidden");
        toggleBtn.setAttribute("aria-expanded", "true");
      } else {
        historyMenu.classList.add("hidden");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  } catch (error) {
    console.error("Failed to initialize popup:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
