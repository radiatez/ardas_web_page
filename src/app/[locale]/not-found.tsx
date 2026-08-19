import { locale as getRootLocale } from "next/root-params";

import { SystemState } from "@/components/public/system-state";
import { isLocale } from "@/i18n/config";

export default async function LocalizedNotFound() {
  const rootLocale = await getRootLocale();
  const locale = isLocale(rootLocale) ? rootLocale : "tr";

  return <SystemState kind="not-found" locale={locale} />;
}
