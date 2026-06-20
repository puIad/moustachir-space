import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ANALYTICS_SCREENS, BRANCHES, branchPath, DATA_MANAGER_PATH } from '../config/branches';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface StarDot {
  left: number;
  top: number;
  size: number;
  opacity: number;
  delay: number;
}

/**
 * Left navigation — the signature "space" panel: a deep-navy gradient with a
 * faint starfield, two grouped sections (Analytics, Business Data).
 */
export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { t } = useTranslation();

  const stars = React.useMemo<StarDot[]>(() => {
    const dots: StarDot[] = [];
    for (let i = 0; i < 40; i++) {
      dots.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        delay: Math.random() * 4,
      });
    }
    return dots;
  }, []);

  const linkStyle = (isActive: boolean, accent?: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    width: '100%',
    height: 42,
    padding: collapsed ? 0 : '0 var(--space-5)',
    justifyContent: collapsed ? 'center' : 'flex-start',
    textDecoration: 'none',
    borderLeft: `3px solid ${isActive ? accent ?? 'var(--blue-500)' : 'transparent'}`,
    background: isActive ? 'rgba(0,116,255,0.12)' : 'transparent',
    transition: 'background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
  });

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)',
        background: 'var(--grad-hero)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'width var(--dur-slow) var(--ease-out)',
        overflow: 'hidden',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* starfield */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
        {stars.map((d, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              background: `rgba(255,255,255,${d.opacity})`,
              animation: `ms-twinkle ${3 + d.delay}s ease-in-out infinite`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* logo */}
      <div
        style={{
          padding: collapsed ? 'var(--space-5) var(--space-3)' : 'var(--space-6) var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 72,
          position: 'relative',
        }}
      >
        <img
          src={collapsed ? '/moustachir-mark.png' : '/moustachir-logo-white.png'}
          alt="Moustachir"
          style={{ height: collapsed ? 28 : 32, width: 'auto', objectFit: 'contain', filter: 'brightness(1.05)' }}
        />
      </div>

      <div style={{ height: 1, margin: '0 var(--space-4)', background: 'rgba(255,255,255,0.08)' }} />

      {/* nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 'var(--space-3) 0', position: 'relative' }}>
        <Group label={collapsed ? null : t('groups.analytics')}>
          {ANALYTICS_SCREENS.map((s) => (
            <NavLink key={s.key} to={s.path} end={s.path === '/'} title={collapsed ? t(`nav.${s.i18nKey}`) : undefined} style={({ isActive }) => linkStyle(isActive)}>
              {({ isActive }) => (
                <>
                  <i className={`ph-fill ${s.icon}`} style={{ fontSize: 20, color: isActive ? 'var(--blue-300)' : 'var(--ink-300)', flexShrink: 0, minWidth: 20 }} aria-hidden="true" />
                  {!collapsed && <NavText active={isActive}>{t(`nav.${s.i18nKey}`)}</NavText>}
                </>
              )}
            </NavLink>
          ))}
        </Group>

        <Group label={collapsed ? null : t('groups.business')}>
          {BRANCHES.map((b) => (
            <NavLink key={b.key} to={branchPath(b.key)} title={collapsed ? t(`nav.${b.i18nKey}`) : undefined} style={({ isActive }) => linkStyle(isActive, b.colorVar)}>
              {({ isActive }) => (
                <>
                  <span style={{ position: 'relative', display: 'inline-flex', minWidth: 20, justifyContent: 'center' }}>
                    <i className={`ph-fill ${b.icon}`} style={{ fontSize: 20, color: isActive ? b.colorVar : 'var(--ink-300)' }} aria-hidden="true" />
                    {/* branch color dot */}
                    <span style={{ position: 'absolute', right: -2, bottom: -1, width: 7, height: 7, borderRadius: '50%', background: b.colorVar, boxShadow: '0 0 0 1.5px var(--navy-800)' }} />
                  </span>
                  {!collapsed && <NavText active={isActive}>{t(`nav.${b.i18nKey}`)}</NavText>}
                </>
              )}
            </NavLink>
          ))}
        </Group>

        <Group label={collapsed ? null : t('groups.system')}>
          <NavLink to={DATA_MANAGER_PATH} title={collapsed ? t('nav.dataManager') : undefined} style={({ isActive }) => linkStyle(isActive, 'var(--branch-unassigned)')}>
            {({ isActive }) => (
              <>
                <i className={`ph-fill ph-database`} style={{ fontSize: 20, color: isActive ? 'var(--branch-unassigned)' : 'var(--ink-300)', flexShrink: 0, minWidth: 20 }} aria-hidden="true" />
                {!collapsed && <NavText active={isActive}>{t('nav.dataManager')}</NavText>}
              </>
            )}
          </NavLink>
        </Group>
      </nav>

      {/* collapse toggle */}
      <div style={{ padding: 'var(--space-3)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? t('shell.expand') : t('shell.collapse')}
          aria-label={collapsed ? t('shell.expand') : t('shell.collapse')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-xs)',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
          }}
        >
          <i className={collapsed ? 'ph-bold ph-caret-right' : 'ph-bold ph-caret-left'} style={{ fontSize: 14 }} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

function Group({ label, children }: { label: React.ReactNode | null; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      {label && (
        <div
          style={{
            font: 'var(--fw-semibold) var(--fs-micro)/1 var(--font-text)',
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--ls-caps)',
            padding: 'var(--space-3) var(--space-5) var(--space-2)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function NavText({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      style={{
        font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-text)',
        color: active ? 'var(--white)' : 'rgba(255,255,255,0.7)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {children}
    </span>
  );
}
