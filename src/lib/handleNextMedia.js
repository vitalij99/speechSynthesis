import { moveToNextPage } from "./pageNavigation";
import { getStorage } from "./storage";

export async function handleNextMedia() {
  const { options } = await getStorage("options");

  window.addEventListener("keydown", (event) => {
    if (event.key === "MediaTrackNext" || event.code === "MediaTrackNext") {
      console.log("handleNextMedia", event);
      moveToNextPage({ nextPageBtn: options.nextPageBtn });
    }
  });
}
