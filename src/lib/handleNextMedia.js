import { moveToNextPage } from "./pageNavigation";
import { getStorage } from "./storage";

export async function handleNextMedia(handleStopClick) {
  const { options } = await getStorage("options");

  window.addEventListener("keydown", (event) => {
    console.log("handleNextMedia", event);
    if (event.key === "MediaTrackNext" || event.code === "MediaTrackNext") {
      moveToNextPage({
        nextPageBtn: options.nextPageBtn,
        handleStopClick,
      });
    }
  });
}
