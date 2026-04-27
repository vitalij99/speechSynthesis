export function setStorageDate({ options, setSaveData, reader }) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + options.timer);
  reader = date.toString();
  setSaveData({ reader });
  return reader;
}
