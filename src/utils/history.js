import { getStorageData, setStorage } from "../lib/storage";

export async function setNewHistory(name, link) {
  if (!link || !name) return;

  const MAX_NAME_LENGTH = 150;
  const HISTORY_LIMIT = 20;

  const history = (await getStorageData("history")) || [];

  const linkSegments = link.split("/");
  const bookLink = linkSegments.slice(0, linkSegments.length - 1).join("/");

  const shortName =
    name.length > MAX_NAME_LENGTH
      ? `${name.substring(0, MAX_NAME_LENGTH - 3)}...`
      : name;

  const filteredHistory = history.filter((item) => {
    if (!item) return false;

    const isDuplicate = item.name === shortName || item.bookLink === bookLink;

    return !isDuplicate;
  });

  const newHistoryItem = {
    name: shortName,
    link: link,
    bookLink: bookLink,
  };

  const updatedHistory = [newHistoryItem, ...filteredHistory].slice(
    0,
    HISTORY_LIMIT,
  );

  await setStorage({ history: updatedHistory });
}
export function getBookUrl(urlPage) {
  const url = new URL(urlPage);

  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length > 1) {
    segments.pop();
  }

  const newPath = "/" + segments.join("/");

  return url.origin + newPath;
}

async function getFindBook(urlPage) {
  const items = await chrome.readingList.query({});

  if (items.length === 0) return;
  const currentUrlBook = getBookUrl(urlPage);

  for (const item of items) {
    if (item.url.includes(currentUrlBook)) {
      return item.url;
    }
  }
}

export async function setReadingList(tab) {
  const readingListUrl = await getFindBook(tab.url);

  if (readingListUrl) {
    chrome.readingList.updateEntry({
      title: tab.title,
      url: readingListUrl,
      hasBeenRead: false,
    });
  } else {
    chrome.readingList.addEntry({
      title: tab.title,
      url: tab.url,
      hasBeenRead: false,
    });
  }
}
