/**
 * Formats date as yyyyMMddHHmmss
 */
export const FormatDate = (date: Date): string => {
  const y = date.getFullYear();
  const M = date.getMonth() + 1;
  const d = date.getDate();
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  return `${y}${M <= 9 ? `0${M}` : M}${d <= 9 ? `0${d}` : d}${
    h <= 9 ? `0${h}` : h
  }${m <= 9 ? `0${m}` : m}${s <= 9 ? `0${s}` : s}`;
};
