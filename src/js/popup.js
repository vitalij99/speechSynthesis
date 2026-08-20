import { getStorage, setStorage } from "../lib/storage";
import { debounce } from "../utils/debounce";

// popup.js
const btnStartReader = document.getElementById("startReader");

const historyMenu = document.getElementById("historyMenu");
const toggleBtn = document.getElementById("toggleHistory");

const rulesText = document.getElementById("rulesText");
const toggleRulesBtn = document.getElementById("toggleRulesText");

let isInitialized = false;

async function updateReaderButton() {
  const isActive = await isReaderActive();

  btnStartReader.textContent = isActive ? "Stop" : "Play";
  btnStartReader.setAttribute("aria-pressed", isActive.toString());
}

function updateNavigatorLink(navigator) {
  const btnBook = document.querySelector("#book");
  const btnWasSleep = document.querySelector("#wasSleep");
  if (!btnBook || !btnWasSleep) return;

  btnBook.textContent = navigator?.book || "Last started reader";
  btnBook.href = navigator?.bookURL || "#";

  if (
    !navigator?.wasSleep?.url ||
    navigator?.wasSleep?.url === navigator?.bookURL
  ) {
    const wasSleepContainer = document.querySelector(".was-sleep-container");
    if (wasSleepContainer) {
      wasSleepContainer.style.display = "none";
    }
  } else {
    btnWasSleep.textContent = navigator.wasSleep.name || "Resume reading";
    btnWasSleep.href = navigator.wasSleep.url || "#";
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
      `,
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
    const isActive = await isReaderActive();

    if (isActive) {
      btnStartReader.textContent = "Play";
    } else {
      window.close();
    }
    await chrome.runtime.sendMessage({ action: "firstTimeScript" });
  } catch (error) {
    console.error("Failed to toggle reader:", error);

    btnStartReader.textContent = "Error - Try again";
    setTimeout(() => updateReaderButton(), 2000);
  }
}

async function toggleHistory() {
  const isHidden = historyMenu.classList.contains("hidden");

  if (isHidden) {
    await loadHistory();
    historyMenu.classList.remove("hidden");
    toggleBtn.setAttribute("aria-expanded", "true");
  } else {
    historyMenu.classList.add("hidden");
    toggleBtn.setAttribute("aria-expanded", "false");
  }
}

function toggleRules(storedRulesText) {
  const isHidden = rulesText.classList.contains("hidden");

  if (isHidden) {
    rulesText.value = storedRulesText || "";
    rulesText.classList.remove("hidden");
    toggleRulesBtn.setAttribute("aria-expanded", "true");
  } else {
    rulesText.classList.add("hidden");
    toggleRulesBtn.setAttribute("aria-expanded", "false");
  }
}

async function init() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const { navigator, rulesText: storedRulesText } = await getStorage([
      "navigator",
      "rulesText",
    ]);

    updateReaderButton();
    updateNavigatorLink(navigator);
    handleAutoStartLink();

    btnStartReader.addEventListener("click", handleReaderToggle);

    toggleBtn.addEventListener("click", toggleHistory);
    toggleRulesBtn.addEventListener("click", () =>
      toggleRules(storedRulesText),
    );
    rulesText.addEventListener(
      "input",
      debounce(() => {
        chrome.storage.sync.set({ rulesText: rulesText.value });
      }, 300),
    );
  } catch (error) {
    console.error("Failed to initialize popup:", error);
  }
}

function handleAutoStartLink() {
  const autoStartLink = document.querySelector(".book-container");

  if (!autoStartLink) return;

  autoStartLink.addEventListener("click", async (e) => {
    if (e.target.tagName.toLowerCase() !== "a") {
      return;
    }
    try {
      chrome.runtime.sendMessage({
        action: "autoStartLink",
      });
    } catch (error) {
      console.error("Failed to start reader from link:", error);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;

  if (changes.navigator) {
    updateNavigatorLink(changes.navigator.newValue);
  }

  if (changes.history && !historyMenu.classList.contains("hidden")) {
    loadHistory();
  }
});

// --- helpers ---
async function isReaderActive(action = "cheakReaderActiveBg", value) {
  try {
    const result = await chrome.runtime.sendMessage({
      action,
      value,
    });

    return result;
  } catch {
    return false;
  }
}
