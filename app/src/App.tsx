import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './shell/AppShell';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { BranchWorkspace } from './screens/BranchWorkspace';
import { DashboardScreen } from './screens/DashboardScreen';
import { FinancialScreen } from './screens/FinancialScreen';
import { MarketingScreen } from './screens/MarketingScreen';
import { CommercialScreen } from './screens/CommercialScreen';
import { ClientFollowupScreen } from './screens/ClientFollowupScreen';
import { OperationalScreen } from './screens/OperationalScreen';
import { FilterProvider } from './filters/FilterContext';
import { ANALYTICS_SCREENS, BRANCHES, DATA_MANAGER_PATH } from './config/branches';
import { DataManagerScreen } from './screens/DataManagerScreen';
import { useSeedBootstrap } from './store/useSeed';
import { DataStatus } from './components/DataStatus';

/** Built Group-1 screens (Steps 4–5). All six are live; placeholder retired. */
const BUILT_SCREENS: Record<string, ReactElement> = {
  dashboard: <DashboardScreen />,
  financial: <FinancialScreen />,
  marketing: <MarketingScreen />,
  commercial: <CommercialScreen />,
  clientFollowup: <ClientFollowupScreen />,
  operational: <OperationalScreen />,
};

/**
 * Provenance per analytics screen — drives the projection badge.
 * Real = Axe2/Axe3 acquisition only; everything with simulated headline
 * numbers shows the PROJECTION badge (see spec/kpi-definitions.md).
 */
const ANALYTICS_PROJECTION: Record<string, boolean> = {
  dashboard: true,
  financial: true,
  marketing: true,
  commercial: true,
  clientFollowup: true,
  operational: true,
};

export default function App() {
  const { ready, status, reset } = useSeedBootstrap();

  if (!ready) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', font: '500 14px var(--font-body, sans-serif)' }}>
        Chargement des données…
      </div>
    );
  }

  return (
    <FilterProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<AppShell />}>
            {ANALYTICS_SCREENS.map((s) => (
              <Route
                key={s.key}
                path={s.path}
                element={BUILT_SCREENS[s.key] ?? <PlaceholderScreen i18nKey={s.i18nKey} variant="analytics" icon={s.icon} projection={ANALYTICS_PROJECTION[s.key]} />}
              />
            ))}
            {BRANCHES.map((b) => (
              <Route
                key={b.key}
                path={`/branch/${b.key}`}
                element={<BranchWorkspace branchKey={b.key} />}
              />
            ))}
            <Route path={DATA_MANAGER_PATH} element={<DataManagerScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <DataStatus status={status} onReset={reset} />
    </FilterProvider>
  );
}
