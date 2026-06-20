import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { FilterBar } from './FilterBar';
import { ANALYTICS_SCREENS, BRANCHES } from '../config/branches';

const STORAGE_KEY = 'moustachir.sidebarCollapsed';

/** Resolve the i18n nav key for the current pathname. */
function useScreenTitle(): string {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  if (pathname === '/data-manager') {
    return t('nav.dataManager');
  }

  const branchMatch = pathname.match(/^\/branch\/([^/]+)/);
  if (branchMatch) {
    const b = BRANCHES.find((x) => x.key === branchMatch[1]);
    if (b) return t(`nav.${b.i18nKey}`);
  }
  const screen = ANALYTICS_SCREENS.find((s) => (s.path === '/' ? pathname === '/' : pathname.startsWith(s.path)));
  return screen ? t(`nav.${screen.i18nKey}`) : t('nav.dashboard');
}

export function AppShell() {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1';
  });
  const title = useScreenTitle();
  const sidebarWidth = collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)';

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Sidebar collapsed={collapsed} onToggleCollapse={toggle} />
      <div
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left var(--dur-slow) var(--ease-out)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TopBar title={title} />
        <FilterBar />
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div key={title} style={{ padding: 'var(--space-6)', animation: 'ms-fade-in var(--dur-base) var(--ease-out)', flex: 1 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
