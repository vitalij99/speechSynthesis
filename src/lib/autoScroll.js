let isAutoScroll = false;
let userScrollTimeout = null;

export function autoScrollToParagraph(container, index) {
  try {
    if (isAutoScroll) return;

    const paragraph = container.children[index];
    if (!paragraph) return;

    paragraph.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
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
];

export function startAutoScrollEvents() {
  userScrollEvents.forEach((event) => {
    window.addEventListener(
      event,
      () => {
        isAutoScroll = true;

        if (userScrollTimeout !== null) {
          clearTimeout(userScrollTimeout);
        }

        userScrollTimeout = window.setTimeout(() => {
          isAutoScroll = false;
          userScrollTimeout = null;
        }, 2000);
      },
      { passive: true }
    );
  });
}
