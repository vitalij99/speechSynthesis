let isStopAutoScroll = false;
let userScrollTimeout = null;

let isScrollEventListener = false;
let autoScrollTimeout = null;

export function autoScrollToParagraph({
  textContainer,
  isAutoScrollDisabled = isStopAutoScroll,
  isHandleParagraphChange = false,
}) {
  try {
    if (!textContainer || isAutoScrollDisabled) return;

    textContainer.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    if (isHandleParagraphChange) return;

    isScrollEventListener = true;

    if (autoScrollTimeout !== null) {
      clearTimeout(autoScrollTimeout);
    }
    autoScrollTimeout = window.setTimeout(() => {
      isScrollEventListener = false;
    }, 300);
  } catch (error) {
    console.error("Error auto-scrolling to paragraph:", error);
  }
}

const userScrollEvents = [
  "wheel",
  "touchstart",
  "touchmove",
  "keydown",
  "mousedown",
  "scroll",
];

export function startAutoScrollEvents() {
  userScrollEvents.forEach((event) => {
    window.addEventListener(
      event,
      () => {
        if (isScrollEventListener) return;
        isStopAutoScroll = true;

        if (userScrollTimeout !== null) {
          clearTimeout(userScrollTimeout);
        }

        userScrollTimeout = window.setTimeout(() => {
          isStopAutoScroll = false;
          userScrollTimeout = null;
        }, 2000);
      },
      { passive: true },
    );
  });
}
