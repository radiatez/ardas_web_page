"use client";

import { useParams } from "next/navigation";

import { SystemState } from "@/components/public/system-state";
import { isLocale } from "@/i18n/config";

export default function LocalizedError({ reset }: { reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale && isLocale(params.locale) ? params.locale : "tr";

  return <SystemState kind="error" locale={locale} onRetry={reset} />;
}
