import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DesignSystemShowcase } from "@/components/public/design-system-showcase";
import { isLocale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Design system preview",
  robots: { index: false, follow: false, nocache: true },
};

export default async function DesignSystemPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <DesignSystemShowcase locale={locale} />;
}
