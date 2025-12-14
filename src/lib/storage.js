export async function getStorage(params) {
  return await chrome.storage.sync.get(params);
}
export async function setStorage(data) {
  return await chrome.storage.sync.set(data);
}
