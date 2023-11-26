const runScriptButton = document.getElementById("start");

runScriptButton.onclick = addScript();
function addScript() {
  // Додати скрипт на сторінку
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: executeCode,
    });
  });
}
function executeCode() {
  // Ваш код, який буде виконано на сторінці
  console.log("Script executed on the page!");
}
