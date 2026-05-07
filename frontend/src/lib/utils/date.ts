import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from "@/constants/app";

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    dateStyle: "medium",
    timeZone: DEFAULT_TIMEZONE,
    ...options,
  }).format(new Date(value));
}
