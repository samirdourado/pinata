const relativeTime = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

export function formatRelativeTime(value: string | number | Date): string {
  const timestamp =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Just now";

  const elapsedSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(elapsedSeconds);
  if (absoluteSeconds < 45) return "Just now";

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let valueInUnit = elapsedSeconds;
  for (const [unitSize, unit] of units) {
    if (Math.abs(valueInUnit) < unitSize) {
      return relativeTime.format(Math.round(valueInUnit), unit);
    }
    valueInUnit /= unitSize;
  }

  return relativeTime.format(Math.round(valueInUnit), "year");
}