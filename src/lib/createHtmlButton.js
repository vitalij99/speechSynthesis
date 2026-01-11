import { setSaveData } from "./storageContent";

const mouse = { x: 0, y: 0 };
let inputParagraf = null;

const buttonStyle = () => `

    .floating-div {
      display: flex;
      position: fixed;
      top: ${mouse.y && mouse.y <= 100 ? mouse.y : 1}%;
      left: ${mouse.x && mouse.x <= 100 ? mouse.x : 1}%;
      width: max-content;
      background-color: lightblue;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
      z-index: 999999;
      cursor: move;
    }
    .action-button {
      margin-right: 10px;
      padding: 8px 16px;
      background-color: #4caf50;
      border: none;
      color: white;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    .action-button:hover {
      background-color: #45a049;
    }
    .input-container {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #fff;
      padding-right: 5px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .input-container input {
      border: none;
      padding: 5px;
      width: 55px;
      font-size: 16px;
      color: #000;
      outline: none;
    }
    .paragraph {
      margin: 0 0 0 -12px;
      color: #000;
      font-size: 16px;
    }
    .paragraph::before {
      content: "/";
      margin-left: 5px;
      margin-right: 5px;
      font-size: 20px;
      color: #777;
    }
    .no-select {
      user-select: none; 
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
  `;

const floatingDivHTML = `
    <div id="floatingDiv" class="floating-div">
      <div>
        <button id="start" class="action-button">Play</button>
        <button id="stop" class="action-button">Stop</button>
      </div>
      <div class="input-container">
        <input type="number" id="inputParagrafs" class="input-number" value="0" min="0" max="7777">
        <p id="paragrafs" class="paragraph">0</p>
      </div>
    </div>
  `;

function onMouseDown(e, draggableElement, state) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") {
    return;
  }

  state.isDragging = true;
  state.startX = e.clientX;
  state.startY = e.clientY;
  state.initialX = (draggableElement.offsetLeft / window.innerWidth) * 100;
  state.initialY = (draggableElement.offsetTop / window.innerHeight) * 100;

  const moveHandler = (e) => onMouseMove(e, draggableElement, state);
  const upHandler = () =>
    onMouseUp(draggableElement, state, moveHandler, upHandler);

  document.addEventListener("mousemove", moveHandler);
  document.addEventListener("mouseup", upHandler);
}

function onMouseMove(e, draggableElement, state) {
  if (!state.isDragging) return;

  const dx = ((e.clientX - state.startX) / window.innerWidth) * 100;
  const dy = ((e.clientY - state.startY) / window.innerHeight) * 100;

  state.newX = (state.initialX + dx).toFixed(2);
  state.newY = (state.initialY + dy).toFixed(2);

  const elementWidth = (draggableElement.offsetWidth / window.innerWidth) * 100;
  const elementHeight =
    (draggableElement.offsetHeight / window.innerHeight) * 100;

  if (state.newX < 0) state.newX = 0;
  if (state.newY < 0) state.newY = 0;
  if (state.newX + elementWidth > 100) state.newX = 100 - elementWidth;
  if (state.newY + elementHeight > 100) state.newY = 100 - elementHeight;

  draggableElement.style.left = `${state.newX}%`;
  draggableElement.style.top = `${state.newY}%`;
}

function onMouseUp(draggableElement, state, moveHandler, upHandler) {
  state.isDragging = false;
  document.removeEventListener("mousemove", moveHandler);
  document.removeEventListener("mouseup", upHandler);

  if (state.newX && state.newY && state.onSave) {
    state.onSave(state.newX, state.newY);
  }
}

async function initGetStorage() {
  const data = await chrome.storage.sync.get("mouse");
  if (data.mouse) Object.assign(mouse, data.mouse);
}

const handleParagraphChange = (isAdd) => {
  if (isAdd) {
    inputParagraf.value = Math.min(
      Number(inputParagraf.value) + 1,
      Number(inputParagraf.max)
    );
  } else {
    inputParagraf.value = Math.max(Number(inputParagraf.value) - 1, 0);
  }
  inputParagraf.onchange();
};

export async function createHTMLButton() {
  if (document.getElementById("chrome-ext-shadow-root")) return;

  await initGetStorage();

  const shadowHost = document.createElement("div");
  shadowHost.id = "chrome-ext-shadow-root";
  shadowHost.style.cssText = "position: fixed; z-index: 999999;";

  const shadowRoot = shadowHost.attachShadow({ mode: "open" });

  const styleElement = document.createElement("style");
  styleElement.textContent = buttonStyle();
  shadowRoot.appendChild(styleElement);

  const container = document.createElement("div");
  container.innerHTML = floatingDivHTML;
  shadowRoot.appendChild(container);

  document.body.appendChild(shadowHost);

  const draggableElement = shadowRoot.getElementById("floatingDiv");

  const state = {
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    newX: null,
    newY: null,
    onSave: (x, y) => {
      mouse.x = x;
      mouse.y = y;
      setSaveData({ mouse });
    },
  };

  draggableElement.addEventListener("mousedown", (e) =>
    onMouseDown(e, draggableElement, state)
  );

  inputParagraf = shadowRoot.getElementById("inputParagrafs");
}
export function addParagraph(paragraf) {
  inputParagraf.value = paragraf;
}

export function setStorageDate({ options, setSaveData, reader }) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + options.timer);
  reader = date.toString();
  setSaveData({ reader });
  return reader;
}
export function setStorageBook({ navigator, setSaveData }) {
  navigator.bookURL = document.URL;
  navigator.book =
    document.title.length > 150
      ? document.title.substring(0, 147) + "..."
      : document.title;
  setSaveData({ navigator });
  return navigator;
}

chrome.runtime.onMessage.addListener(async (message) => {
  const { action, value } = message;

  if (action === "objustParagraphs") {
    if (value !== undefined) handleParagraphChange(value);
  }
});
