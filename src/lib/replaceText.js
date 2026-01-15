let rulesText = `
депутатів - мана
світ - world
JS - JavaScript
`;

export function replaceText(text) {
  const rules = rulesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [from, to] = line.split(/\s*-\s*/);
      return { from, to };
    });

  for (const { from, to } of rules) {
    const regex = new RegExp(`(?<=^|\\s)${escapeRegExp(from)}(?=\\s|$)`, "gi");

    text = text.replace(regex, to);
  }

  return text;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function initStorageRulesText() {
  const storedRules = await chrome.storage.sync.get("rulesText");
  console.log("Stored rules:", storedRules);
  if (storedRules.rulesText) {
    rulesText = storedRules.rulesText;
  }
}
chrome.storage.onChanged.addListener((changes) => {
  if (changes.rulesText) {
    rulesText = changes.rulesText.newValue;
  }
});
