import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';
import type { AppLanguage } from '../i18n/resources';
import { IconButton, Avatar } from '../design-system';

interface TopBarProps {
  title: string;
}

const LANGS: AppLanguage[] = ['fr', 'en'];

/** Top bar — current screen title, language toggle, notifications, user. */
export function TopBar({ title }: TopBarProps) {
  const { t, i18n } = useTranslation();
  const current = (i18n.language.startsWith('en') ? 'en' : 'fr') as AppLanguage;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        height: 'var(--topbar-h)',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--divider)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: '0 var(--space-6)',
        zIndex: 90,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <h2 style={{ font: 'var(--text-h2)', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </h2>

      {/* language toggle */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-3)', borderRadius: 'var(--radius-pill)', padding: 3, gap: 2 }} role="group" aria-label={t('shell.language')}>
        {LANGS.map((l) => {
          const active = current === l;
          return (
            <button
              key={l}
              type="button"
              onClick={() => setLanguage(l)}
              aria-pressed={active}
              style={{
                height: 28,
                padding: '0 12px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: active ? 'var(--blue-500)' : 'transparent',
                color: active ? 'var(--white)' : 'var(--ink-500)',
                font: 'var(--fw-bold) var(--fs-micro)/1 var(--font-text)',
                cursor: 'pointer',
                transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
              }}
            >
              {l.toUpperCase()}
            </button>
          );
        })}
      </div>

      <IconButton variant="ghost" ariaLabel={t('shell.notifications')} badge>
        <i className="ph-fill ph-bell" aria-hidden="true" />
      </IconButton>

      <div style={{ width: 1, height: 28, background: 'var(--line-200)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Avatar name={t('shell.user')} size={36} />
        <div style={{ minWidth: 0 }}>
          <div style={{ font: 'var(--fw-bold) var(--fs-sm)/1.1 var(--font-text)', color: 'var(--text-primary)' }}>{t('shell.user')}</div>
          <div style={{ font: 'var(--fw-medium) var(--fs-micro)/1.1 var(--font-text)', color: 'var(--text-muted)' }}>{t('shell.role')}</div>
        </div>
      </div>
    </header>
  );
}
