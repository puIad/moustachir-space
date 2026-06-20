/* global React */
// MoustachirSpace · Dashboard — greeting, stats, activity, missions.
function DashboardScreen({ onOpenMission }) {
  const NS = window.MoustachirSpaceDesignSystem_d4c8ce;
  const { AppHeader, IconButton, Avatar, StatCard, ListRow, StatusPill, ProgressRing } = NS;

  const Section = ({ title, count, children }) => (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0, font: 'var(--fw-bold) var(--fs-h2)/1 var(--font-display)', letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>{title}</h2>
        {count != null && (
          <span style={{ font: 'var(--fw-bold) 13px var(--font-text)', color: 'var(--blue-500)' }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  );

  const ActivityCard = ({ tag, icon, tone, name, time }) => (
    <div style={{ flex: '0 0 64%', background: 'var(--surface-tint)', borderRadius: 'var(--radius-md)', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: 'var(--fw-medium) 12px var(--font-text)', color: 'var(--ink-500)' }}>{tag}</span>
        <span style={{ width: 26, height: 26, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: tone === 'blue' ? 'var(--blue-500)' : 'var(--white)', color: tone === 'blue' ? '#fff' : 'var(--blue-500)', fontSize: 14, boxShadow: tone === 'blue' ? 'none' : 'var(--shadow-xs)' }}>
          <i className={icon} />
        </span>
      </div>
      <div style={{ font: 'var(--fw-bold) 16px/1.2 var(--font-text)', color: 'var(--ink-900)', marginTop: 14 }}>{name}</div>
      <div style={{ font: 'var(--fw-medium) 12px var(--font-text)', color: 'var(--ink-400)', marginTop: 6 }}>{time}</div>
    </div>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--surface-2)' }}>
      <AppHeader
        variant="greeting"
        name="Khaled Ferroukhi"
        avatar={<Avatar name="Khaled Ferroukhi" size={46} src="https://i.pravatar.cc/96?img=12" />}
        trailing={<IconButton variant="plain" badge ariaLabel="Notifications"><i className="ph-fill ph-bell" /></IconButton>}
      />

      <div style={{ padding: '4px 16px 28px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <StatCard label="Leads Added" value="14" delta="+3 vs last week" deltaTone="up" watermark={<i className="ph-fill ph-seal-check" />} />
          <StatCard label="Avg. Feedback" value="4.2" unit="★" delta="From 8 Clients" deltaTone="flat" watermark={<i className="ph-fill ph-medal" />} />
        </div>

        {/* Recent activity */}
        <Section title="Recent Activity" count="2">
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: '0 -16px', padding: '2px 16px', scrollbarWidth: 'none' }}>
            <ActivityCard tag="Lead Added" icon="ph-fill ph-user-plus" tone="blue" name="Parapharm Expo" time="2h ago" />
            <ActivityCard tag="Feedback Collected" icon="ph-fill ph-chat-circle-dots" tone="white" name="Abderrahmane Ammali" time="Yesterday" />
          </div>
        </Section>

        {/* Missions */}
        <Section title="My Missions" count="3">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ListRow icon={<i className="ph-fill ph-globe-hemisphere-west" />} iconTone="blue"
              title="Website dev — Lazzouzi Lyna" subtitle={<StatusPill status="progress" />} meta="#MC-0418"
              trailing={<ProgressRing value={70} tone="blue" />} onClick={() => onOpenMission && onOpenMission()} />
            <ListRow icon={<i className="ph-fill ph-palette" />} iconTone="ink"
              title="Branding — Fernane Mourad I." subtitle={<StatusPill status="scheduled" />} meta="#MC-0422"
              trailing={<i className="ph ph-caret-right" style={{ fontSize: 18, color: 'var(--ink-300)' }} />} onClick={() => onOpenMission && onOpenMission()} />
            <ListRow icon={<i className="ph-fill ph-graduation-cap" />} iconTone="orange"
              title="Academy Platform — Amiar M." subtitle={<StatusPill status="delayed" />} meta="#MC-0031"
              trailing={<ProgressRing value={87} tone="orange" />} onClick={() => onOpenMission && onOpenMission()} />
          </div>
        </Section>
      </div>
    </div>
  );
}
window.DashboardScreen = DashboardScreen;
