console.log("Script loaded");let saveDataTimeout=null,lastData=null,reader=null,paragraf=0;const navigator={nextPageSave:null,thisPageSave:null,bookURL:null,book:null},mouse={x:0,y:0},options={contentDivElem:"#content  ",nextPageBtn:".nextchap",timer:20,lastParagraf:0,timerCheckbox:!0,timeout:2e3,utterThis:{language:null,pitch:2,rate:2,volume:1}};let paused=!1,saveStyledParagraf=null,timerId=null,timerCounter={count:0,paragraf:0};async function startReade(){let e=getHtmlElements(options.contentDivElem);var t;!(e=!e||e.length<=1?findElementWithMostDirectParagraphs():e)||e.children.length<=5?(console.error("No readable content found."),console.dir(e)):(t=window.speechSynthesis,createHTMLButton(),configureButtons(e,t))}function setNextPage(){var e=getHtmlElements(options.nextPageBtn);navigator.thisPageSave=document.URL,e&&(navigator.nextPageSave=e?e?.attributes?.href?.value:getNextPage()),setSaveData({navigator:navigator})}function getHtmlElements(e){try{return e.split("\n").map(e=>{if(!e.trim())return null;try{return document.querySelector(e)}catch{return null}}).filter(Boolean)?.[0]||null}catch{return null}}function configureButtons(a,n){const e=document.getElementById("start");var t=document.getElementById("stop");const r=document.getElementById("inputParagrafs");var o=document.getElementById("paragrafs");e.textContent=paused?"Play":"Pause",o.textContent=a.children.length,r.max=a.children.length,r.value=paragraf;let i=n.getVoices();n.onvoiceschanged=()=>{i=n.getVoices()},setNextPage();const s=debounce(()=>{n.speaking&&n.cancel(),l()},300);function l(){var e,t;n.speaking?console.error("speechSynthesis.speaking"):(paragraf>=a.children.length-(options.lastParagraf||0)&&options.timerCheckbox&&moveToNextPage(),t=a.children[paragraf],e=checkText(Array.from(t?.childNodes).map(e=>e.textContent).join("")),t.clientHeight<8||!e?(paragraf++,r.value=paragraf,l()):""!==e&&(t=new SpeechSynthesisUtterance(e),styleCurrentParagraph(a,paragraf),saveStyledParagraf=paragraf,t.onend=()=>{clearParagraphStyle(a,saveStyledParagraf||paragraf),paragraf++,r.value=paragraf,reader&&(setSaveData({paragraf:paragraf}),l())},t.onerror=e=>{"interrupted"!==e.error&&(console.error("SpeechSynthesisUtterance.onerror",e.error),timerCounter.count++,timerCounter.paragraf=paragraf,3<=timerCounter.count&&timerCounter.paragraf===paragraf&&(clearParagraphStyle(a,paragraf),paragraf++,timerCounter.count=0),resetReader({synth:n,textContainer:a,paragraf:paragraf,speak:l}))},setVoice(t,i),t.pitch=options.utterThis.pitch,t.rate=options.utterThis.rate,t.volume=options.utterThis.volume,n.speak(t)))}const c=new Date(reader),u=new Date;setTimeout(()=>{reader&&c>u&&(setNextPage(),l())},Number(options.timeout)?Number(options.timeout):1e3),e.onclick=()=>handleStartClick(n,e,l),t.onclick=()=>handleStopClick(n,e,a,paragraf),r.onchange=()=>{clearParagraphStyle(a,paragraf),(paragraf=Number(r.value))<0&&(paragraf=0),s()}}function handleParagraphChange(e){var t=document.getElementById("inputParagrafs");t.value=e?Math.min(Number(t.value)+1,Number(t.max)):Math.max(Number(t.value)-1,0),t.onchange()}function handleStartClick(e,t,a){e.speaking?paused?(paused=!1,e.resume(),t.textContent="Pause"):(paused=!0,e.pause(),t.textContent="Play"):(setStorageDate(),setStorageBook(),a())}function handleStopClick(e,t,a,n){reader=null,navigator.bookURL=document.URL,navigator.book=150<document.title.length?document.title.substring(0,147)+"...":document.title,clearParagraphStyle(a,n),e.cancel(),t.textContent="Play",paused=!1,setSaveData({reader:reader,navigator:navigator}),chrome.runtime.sendMessage("stopScript")}function styleCurrentParagraph(e,t){try{var a=e.children[t];a.style.backdropFilter="blur(10px)",a.style.background="rgba(255, 255, 255, 0.15)",a.style.filter="invert(1)",a.style.borderRadius="6px",a.style.outline="2px solid rgba(0,0,0,0.9)",a.scrollIntoView({behavior:"smooth",block:"center"})}catch(e){console.error("Error styling paragraph:",e)}}function clearParagraphStyle(e,t){try{e.children[t].style=""}catch{}}function setVoice(e,t){if(options.utterThis.language)for(const a of t)if(a.name===options.utterThis.language){e.voice=a;break}}function moveToNextPage(){const e=window.location.href;var t={key:"ArrowRight",code:"ArrowRight",keyCode:39,which:39,bubbles:!0},a=new KeyboardEvent("keydown",t),t=new KeyboardEvent("keyup",t);window.dispatchEvent(a),window.dispatchEvent(t),document.dispatchEvent(a),document.dispatchEvent(t),setTimeout(()=>{window.location.href===e&&(window.location.href=navigator.nextPageSave)},1e3)}function getStorageData(){return new Promise(t=>{chrome.storage.sync.get(["reader","navigator","mouse","options","paragraf"],e=>{t(e)})})}function createHTMLButton(){if(document.getElementById("floatingDiv"))return;var e=`
    .floating-div {
      display: flex;
      position: fixed;
      top: ${mouse.y&&mouse.y<=100?mouse.y:1}%;
      left: ${mouse.x&&mouse.x<=100?mouse.x:1}%;
      width: max-content;
      background-color: lightblue;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
      z-index: 999;
    
    }
    .action-button {
      margin-right: 10px;
      padding: 8px 16px;
      background-color: #4caf50;
      border: none;
      color: white;
      border-radius: 5px;
      cursor: pointer;
    }
    .input-container {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color
      : #fff;
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
    }
    .paragraph {
      margin: 0 0 0 -12px;
      color: #000;
    }
    .paragraph::before {
      content: "/";
      margin-left: 5px;
      margin-right: 5px;
      font-size: 20px;
      color: #777;
    }

    #draggable {
      user-select: none;    
    }
    .no-select {
      user-select: none; 
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      }
  `,t=document.createElement("div"),a=(t.innerHTML=`
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
  `,document.createElement("style"));a.textContent=e,document.body.appendChild(t),document.head.appendChild(a);const n=document.getElementById("floatingDiv");let r=!1,o,i,s,l,c,u;n.addEventListener("mousedown",e=>{r=!0,o=e.clientX,i=e.clientY,s=n.offsetLeft/window.innerWidth*100,l=n.offsetTop/window.innerHeight*100,document.body.classList.add("no-select"),document.addEventListener("mousemove",d),document.addEventListener("mouseup",g)});const d=e=>{var t;r&&(t=(e.clientX-o)/window.innerWidth*100,e=(e.clientY-i)/window.innerHeight*100,c=(s+t).toFixed(2),u=(l+e).toFixed(2),t=n.offsetWidth/window.innerWidth*100,e=n.offsetHeight/window.innerHeight*100,c<0&&(c=0),u<0&&(u=0),100<c+t&&(c=100-t),100<u+e&&(u=100-e),n.style.left=c+"%",n.style.top=u+"%")},g=()=>{r=!1,document.removeEventListener("mousemove",d),document.removeEventListener("mouseup",g),document.body.classList.remove("no-select"),c&&u&&(mouse.x=c,mouse.y=u,setSaveData({mouse:mouse}))}}function findElementWithMostDirectParagraphs(){var t;let a=0,n=null;for(t of document.querySelectorAll("body *")){let e=0;for(var r of t.children)"P"!==r.tagName&&"SPAN"!==r.tagName||e++;e>a&&(a=e,n=t)}return n}function getNextPage(){var t=document.URL,a=[];for(let e=1;e<t.length;e++){var n=t[t.length-e];if(isNaN(n)){if(1!==e)return t.slice(0,t.length-e+1)+(parseInt(a.join(""))+1)}else a.unshift(n)}return t}function setStorageDate(){var e=new Date;e.setMinutes(e.getMinutes()+options.timer),setSaveData({reader:reader=e.toString()})}function setStorageBook(){navigator.bookURL=document.URL,navigator.book=150<document.title.length?document.title.substring(0,147)+"...":document.title,setSaveData({navigator:navigator})}function checkText(e){return e?e&&/[\p{L}\p{N}]/u.test(e)?e.replace(/(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu,""):void 0:""}function resetReader({synth:e,textContainer:t,paragraf:a,speak:n}){console.log("⏹ Озвучка зупинилася або нема нових слів."),options.timerCheckbox&&reader&&(clearParagraphStyle(t,a),e.cancel(),e.speaking||n())}function setSaveData(e){lastData={...lastData,...e},saveDataTimeout&&clearTimeout(saveDataTimeout),saveDataTimeout=setTimeout(()=>{chrome.storage.sync.set(Object.fromEntries(Object.entries(lastData).filter(([,e])=>void 0!==e))),lastData=null,saveDataTimeout=null},300)}async function initGetStorage(){var e=await getStorageData();void 0!==e.reader&&(reader=e.reader),void 0!==e.paragraf&&(paragraf=e.paragraf),e.navigator&&Object.assign(navigator,e.navigator),e.mouse&&Object.assign(mouse,e.mouse),e.options&&Object.assign(options,e.options)}async function handleStartReadFun(){var e=document.URL;await initGetStorage(),e!==navigator.thisPageSave&&setSaveData({paragraf:paragraf=0}),setStorageDate(),setStorageBook(),startReade()}async function handleStartReadNextPage(e){var t=document.URL,a=(await initGetStorage(),new Date(reader)),n=new Date,e=t.includes(e);reader&&e&&options?.timerCheckbox&&n<a&&(t!==navigator.thisPageSave&&(paragraf=0),startReade())}function debounce(t,a=300){let n;return function(...e){clearTimeout(n),n=setTimeout(()=>t.apply(this,e),a)}}chrome.runtime.onMessage.addListener(async e=>{var{action:e,value:t}=e;switch(e){case"startReadeFun":await handleStartReadFun();break;case"startReadeNextPage":await handleStartReadNextPage(t);break;case"objustParagraphs":void 0!==t&&handleParagraphChange(t)}}),chrome.storage.onChanged.addListener(e=>{e.reader&&(reader=e.reader.newValue),e.navigator&&Object.assign(navigator,e.navigator.newValue),e.mouse&&Object.assign(mouse,e.mouse.newValue),e.options&&Object.assign(options,e.options.newValue)});