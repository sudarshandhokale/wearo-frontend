export const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export function inferDeviceCountryCode(timezoneCountries: Record<string, string> = {}) {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale || "";
  const localeRegion = locale.match(/[-_]([A-Z]{2})(?:$|[-_])/i)?.[1]?.toUpperCase();
  return timezoneCountries[deviceTimezone] || localeRegion || "US";
}
