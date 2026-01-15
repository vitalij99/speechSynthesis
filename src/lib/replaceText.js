let rulesText = ``;
let rules = null;

export function replaceText(text) {
  if (!rules) {
    updateRules(rulesText);
  }
  if (!rules.length) {
    return text;
  }

  for (const { from, to } of rules) {
    const regex = new RegExp(
      `(?<=^|\\s|[.!?,;:\\[\\]()\"'+\\-])${escapeRegExp(
        from
      )}(?=\\s|$|[.!?,;:\\[\\]()\"'+\\-])`,
      "gi"
    );

    text = text.replace(regex, to);
  }

  return text;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateRules(rulesText) {
  rules = rulesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [from, to] = line.split(/\s*-\s*/);
      return { from, to };
    })
    .filter((rule) => rule.from && rule.to);
}

export async function initStorageRulesText() {
  const storedRules = await chrome.storage.sync.get("rulesText");

  if (storedRules.rulesText) {
    rulesText = storedRules.rulesText;

    updateRules(rulesText);
  }
}
chrome.storage.onChanged.addListener((changes) => {
  if (changes.rulesText) {
    rulesText = changes.rulesText.newValue;
    updateRules(rulesText);
  }
});
