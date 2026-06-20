/* global React */
// MoustachirSpace · Client Feedback capture.
function FeedbackScreen({ onBack, onSubmit }) {
  const NS = window.MoustachirSpaceDesignSystem_d4c8ce;
  const { AppHeader, IconButton, SearchField, SegmentedControl, StarRating, Chip, Textarea, Button, StatusPill } = NS;
  const { useState } = React;
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('Verbally');
  const [rating, setRating] = useState(4);
  const [wins, setWins] = useState({ quality: true, ontime: true, pricing: false });
  const [issues, setIssues] = useState({ scope: true, delays: false, other: false });
  const [notes, setNotes] = useState('');

  const FieldLabel = ({ children }) => (
    <div style={{ font: 'var(--fw-semibold) 13px var(--font-text)', color: 'var(--ink-500)', margin: '4px 0 2px' }}>{children}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-2)' }}>
      <AppHeader
        variant="title"
        title="Client Feedback"
        leading={<IconButton variant="plain" ariaLabel="Back" onClick={onBack}><i className="ph ph-arrow-left" /></IconButton>}
        trailing={<IconButton variant="plain" badge ariaLabel="Notifications"><i className="ph-fill ph-bell" /></IconButton>}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SearchField value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} placeholder="Name or mission ID…" />

        {/* Selected client */}
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-md)', padding: 14, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ font: 'var(--fw-bold) 16px var(--font-text)', color: 'var(--ink-900)' }}>Ahmed Assem Meddah</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ font: 'var(--fw-medium) 12px var(--font-text)', color: 'var(--ink-400)' }}>Portfolio Website · #MC-0421</span>
            <StatusPill status="done">Completed 2d ago</StatusPill>
          </div>
        </div>

        <SegmentedControl value={mode} onChange={setMode} options={['Verbally', 'Online Chat']} />

        <div>
          <FieldLabel>Overall satisfaction</FieldLabel>
          <StarRating value={rating} onChange={setRating} size={30} />
        </div>

        <div>
          <FieldLabel>What went well the most?</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Chip selected={wins.quality} onToggle={(v) => setWins({ ...wins, quality: v })}>High Quality</Chip>
            <Chip selected={wins.ontime} onToggle={(v) => setWins({ ...wins, ontime: v })}>On Time</Chip>
            <Chip selected={wins.pricing} onToggle={(v) => setWins({ ...wins, pricing: v })}>Pricing</Chip>
          </div>
        </div>

        <div>
          <FieldLabel>Any issues raised?</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Chip tone="orange" selected={issues.scope} onToggle={(v) => setIssues({ ...issues, scope: v })}>Unclear Scope</Chip>
            <Chip tone="orange" selected={issues.delays} onToggle={(v) => setIssues({ ...issues, delays: v })}>Delays</Chip>
            <Chip tone="ink" selected={issues.other} onToggle={(v) => setIssues({ ...issues, other: v })}>Other</Chip>
          </div>
        </div>

        <Textarea label="Notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else worth recording…" />
      </div>
      <div style={{ padding: '12px 16px 18px', background: 'linear-gradient(to top, var(--surface-2) 70%, transparent)' }}>
        <Button variant="primary" full size="lg" onClick={onSubmit} leadingIcon={<i className="ph-fill ph-paper-plane-tilt" />}>Submit</Button>
      </div>
    </div>
  );
}
window.FeedbackScreen = FeedbackScreen;
