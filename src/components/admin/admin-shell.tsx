import type { Route } from "next";
import Link from "next/link";

export type AdminNavigationItem = Readonly<{
  href: string;
  label: string;
}>;

export function AdminShell({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation: readonly AdminNavigationItem[];
}) {
  return <>
    <a className="admin-skip-link" href="#admin-main-content">Ana içeriğe geç</a>
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">ARDAŞ<small>YÖNETİM MERKEZİ</small></Link>
        {navigation.length ? <nav className="admin-nav" aria-label="Yönetim modülleri">
          {navigation.map((item) => <Link href={item.href as Route} key={item.href}>{item.label}</Link>)}
        </nav> : null}
        <div className="admin-sidebar__footer">Permission tabanlı erişim<br />Production: MFA zorunlu</div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar"><span>Türkçe yönetim arayüzü</span><Link href="/tr" target="_blank" rel="noreferrer">Public siteyi aç ↗</Link></header>
        <div className="admin-content" id="admin-main-content" tabIndex={-1}>{children}</div>
      </div>
    </div>
  </>;
}
