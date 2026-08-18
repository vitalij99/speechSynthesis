let writeQueue = Promise.resolve();

export function consoleLog(...params) {
  console.log(...params);

  writeQueue = writeQueue
    .then(async () => {
      const { log = [] } = await chrome.storage.local.get("log");
      const lastLog = Array.isArray(log) ? log : [];

      const time = new Date();
      const day = String(time.getDate()).padStart(2, "0");
      const month = String(time.getMonth() + 1).padStart(2, "0");
      const hours = String(time.getHours()).padStart(2, "0");
      const minutes = String(time.getMinutes()).padStart(2, "0");
      const formattedTime = `${day}.${month} ${hours}:${minutes}`;

      const saveLogs = [{ [formattedTime]: params }, ...lastLog].slice(0, 20);

      await chrome.storage.local.set({ log: saveLogs });
    })
    .catch((err) => {
      console.error("consoleLog write failed:", err);
    });

  return writeQueue;
}
export async function getLogs() {
  const data = await chrome.storage.local.get("log");
  console.log(data);
}
