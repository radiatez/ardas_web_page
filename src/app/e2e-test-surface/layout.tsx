import type { Metadata } from "next";

import "@/styles/admin.css";

export const metadata: Metadata = {
  title: "Admin UI test yüzeyi",
  robots: { index: false, follow: false, noarchive: true },
};

export default function E2eLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
