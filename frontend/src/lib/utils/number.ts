import { DEFAULT_LOCALE } from "@/constants/app";

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(DEFAULT_LOCALE, options).format(value);
}
