import { notFound } from "next/navigation";

import { SystemState } from "@/components/public/system-state";
import { isLocale } from "@/i18n/config";

export default async function UnavailablePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <SystemState kind="unavailable" locale={locale} />;
}
