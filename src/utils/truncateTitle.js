export function truncateTitle(title, maxLength = 150) {
  if (!title) return "";
  return title.length > maxLength
    ? `${title.substring(0, maxLength - 3)}...`
    : title;
}
