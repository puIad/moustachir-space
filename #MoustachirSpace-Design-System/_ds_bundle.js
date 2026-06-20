/* @ds-bundle: {"format":3,"namespace":"MoustachirSpaceDesignSystem_d4c8ce","components":[{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"ListRow","sourcePath":"components/data/ListRow.jsx"},{"name":"ProgressRing","sourcePath":"components/data/ProgressRing.jsx"},{"name":"StarRating","sourcePath":"components/data/StarRating.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"StatusPill","sourcePath":"components/data/StatusPill.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Chip","sourcePath":"components/forms/Chip.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"TextField","sourcePath":"components/forms/TextField.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"AppHeader","sourcePath":"components/layout/AppHeader.jsx"},{"name":"BottomNav","sourcePath":"components/layout/BottomNav.jsx"},{"name":"Card","sourcePath":"components/layout/Card.jsx"}],"sourceHashes":{"components/data/Avatar.jsx":"b4f0bf11732d","components/data/ListRow.jsx":"a6ab708288e8","components/data/ProgressRing.jsx":"83dbcb5903d2","components/data/StarRating.jsx":"f5dbeed73a73","components/data/StatCard.jsx":"f097a1f997d9","components/data/StatusPill.jsx":"02dfd9cf28df","components/forms/Button.jsx":"ae877662aa49","components/forms/Chip.jsx":"d8befeab895d","components/forms/IconButton.jsx":"08535dc19763","components/forms/SearchField.jsx":"0ac611b1e1bc","components/forms/SegmentedControl.jsx":"a7615643a4fa","components/forms/Select.jsx":"e2b6219d152a","components/forms/TextField.jsx":"d3c7bf3ffbe3","components/forms/Textarea.jsx":"7b6c9aff1cf1","components/layout/AppHeader.jsx":"135a10fa6d27","components/layout/BottomNav.jsx":"45d255a23f9a","components/layout/Card.jsx":"31d00d21b99c","ui_kits/moustachir-app/DashboardScreen.jsx":"369f77ea8a99","ui_kits/moustachir-app/FeedbackScreen.jsx":"d93062d1d16d","ui_kits/moustachir-app/LoginScreen.jsx":"255b84bf27ce","ui_kits/moustachir-app/NewLeadScreen.jsx":"2585311385d6"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MoustachirSpaceDesignSystem_d4c8ce = window.MoustachirSpaceDesignSystem_d4c8ce || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Avatar — circular photo, or initials on a tinted disc as fallback.
 */
function Avatar({
  src = null,
  name = '',
  size = 44,
  ring = false,
  style = {},
  ...rest
}) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const common = {
    width: size,
    height: size,
    borderRadius: '999px',
    flex: '0 0 auto',
    boxShadow: ring ? '0 0 0 2px var(--white), 0 0 0 4px var(--blue-500)' : 'none',
    ...style
  };
  if (src) {
    return /*#__PURE__*/React.createElement("img", _extends({
      src: src,
      alt: name,
      style: {
        ...common,
        objectFit: 'cover',
        display: 'block'
      }
    }, rest));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...common,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--blue-50)',
      color: 'var(--blue-600)',
      font: `var(--fw-bold) ${Math.round(size * 0.38)}px/1 var(--font-display)`
    }
  }, rest), initials || '?');
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data/ListRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tappable list row — a white card with a tinted leading icon tile, a title +
 * subtitle/meta, and a trailing slot (progress ring, chevron, etc).
 * Used for "My Missions", activity lists and lead lists.
 */
function ListRow({
  icon = null,
  iconTone = 'blue',
  title,
  subtitle = null,
  meta = null,
  trailing = null,
  onClick,
  style = {},
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const tones = {
    blue: {
      bg: 'var(--blue-50)',
      fg: 'var(--blue-500)'
    },
    orange: {
      bg: 'var(--orange-50)',
      fg: 'var(--orange-500)'
    },
    green: {
      bg: 'var(--green-50)',
      fg: 'var(--green-500)'
    },
    ink: {
      bg: 'var(--surface-3)',
      fg: 'var(--ink-500)'
    }
  };
  const t = tones[iconTone] || tones.blue;
  const clickable = !!onClick;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onPointerDown: () => clickable && setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-card)',
      cursor: clickable ? 'pointer' : 'default',
      transform: pressed ? 'scale(0.99)' : 'scale(1)',
      transition: 'transform var(--dur-fast) var(--ease-out)',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-sm)',
      background: t.bg,
      color: t.fg,
      fontSize: 20
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) var(--fs-body)/1.25 var(--font-text)',
      color: 'var(--ink-900)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title), (subtitle || meta) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 5
    }
  }, subtitle, meta && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) var(--fs-label)/1 var(--font-text)',
      color: 'var(--ink-400)'
    }
  }, meta))), trailing && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto'
    }
  }, trailing));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressRing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Circular progress ring with a centred percentage — used on mission rows.
 * SVG data-viz primitive (not an icon). Tone colours the arc.
 */
function ProgressRing({
  value = 0,
  size = 44,
  thickness = 5,
  tone = 'blue',
  showLabel = true,
  style = {},
  ...rest
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const tones = {
    blue: 'var(--blue-500)',
    orange: 'var(--orange-500)',
    green: 'var(--green-500)',
    red: 'var(--red-500)',
    ink: 'var(--ink-400)'
  };
  const stroke = tones[tone] || tones.blue;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: size,
      height: size,
      flex: '0 0 auto',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      display: 'block',
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--line-200)",
    strokeWidth: thickness
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: stroke,
    strokeWidth: thickness,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: offset,
    style: {
      transition: 'stroke-dashoffset var(--dur-slow) var(--ease-out)'
    }
  })), showLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: `var(--fw-bold) ${Math.round(size * 0.26)}px/1 var(--font-text)`,
      color: 'var(--ink-900)'
    }
  }, clamped, "%"));
}
Object.assign(__ds_scope, { ProgressRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressRing.jsx", error: String((e && e.message) || e) }); }

// components/data/StarRating.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Star rating — electric-blue filled stars. Interactive when onChange is set,
 * otherwise a read-only display (supports halves via `value`).
 */
function StarRating({
  value = 0,
  max = 5,
  onChange,
  size = 26,
  tone = 'blue',
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(null);
  const color = tone === 'amber' ? 'var(--amber-500)' : 'var(--blue-500)';
  const shown = hover != null ? hover : value;
  const interactive = !!onChange;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      gap: 6,
      ...style
    },
    role: interactive ? 'slider' : 'img',
    "aria-label": `${value} of ${max}`
  }, rest), Array.from({
    length: max
  }).map((_, i) => {
    const filled = i + 1 <= Math.round(shown);
    return /*#__PURE__*/React.createElement("i", {
      key: i,
      className: filled ? 'ph-fill ph-star' : 'ph ph-star',
      onMouseEnter: interactive ? () => setHover(i + 1) : undefined,
      onMouseLeave: interactive ? () => setHover(null) : undefined,
      onClick: interactive ? () => onChange(i + 1) : undefined,
      style: {
        fontSize: size,
        color: filled ? color : 'var(--ink-300)',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'transform var(--dur-fast) var(--ease-spring), color var(--dur-fast) var(--ease-out)',
        transform: interactive && hover === i + 1 ? 'scale(1.15)' : 'scale(1)'
      },
      "aria-hidden": "true"
    });
  }));
}
Object.assign(__ds_scope, { StarRating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StarRating.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Dashboard metric card — label, big number, delta line, and a faint
 * watermark icon. Light surface, soft rounded.
 */
function StatCard({
  label,
  value,
  unit = null,
  delta = null,
  deltaTone = 'up',
  watermark = null,
  style = {},
  ...rest
}) {
  const deltaColor = deltaTone === 'up' ? 'var(--green-500)' : deltaTone === 'down' ? 'var(--red-500)' : 'var(--ink-400)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--surface-3)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 16px',
      minWidth: 0,
      ...style
    }
  }, rest), watermark && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      right: -6,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: 92,
      lineHeight: 0,
      color: 'rgba(21,35,63,0.05)',
      pointerEvents: 'none'
    }
  }, watermark), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-text)',
      color: 'var(--ink-500)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) var(--fs-stat)/1 var(--font-display)',
      letterSpacing: '-0.02em',
      color: 'var(--ink-900)'
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) var(--fs-h3)/1 var(--font-display)',
      color: 'var(--ink-700)'
    }
  }, unit)), delta && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
      font: 'var(--fw-semibold) var(--fs-label)/1 var(--font-text)',
      color: deltaColor
    }
  }, deltaTone !== 'flat' && /*#__PURE__*/React.createElement("i", {
    className: deltaTone === 'up' ? 'ph-bold ph-trend-up' : 'ph-bold ph-trend-down',
    style: {
      fontSize: 13
    },
    "aria-hidden": "true"
  }), delta)));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/data/StatusPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const STATUS = {
  progress: {
    fg: 'var(--status-progress)',
    bg: 'var(--status-progress-bg)',
    label: 'In Progress'
  },
  scheduled: {
    fg: 'var(--status-scheduled)',
    bg: 'var(--status-scheduled-bg)',
    label: 'Scheduled'
  },
  delayed: {
    fg: 'var(--status-delayed)',
    bg: 'var(--status-delayed-bg)',
    label: 'Delayed'
  },
  done: {
    fg: 'var(--status-done)',
    bg: 'var(--status-done-bg)',
    label: 'Completed'
  }
};

/**
 * Status pill for missions / leads / feedback. Pass a known `status`
 * (progress|scheduled|delayed|done) or override children + tone.
 */
function StatusPill({
  status = 'progress',
  children,
  dot = true,
  style = {},
  ...rest
}) {
  const s = STATUS[status] || STATUS.progress;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 24,
      padding: '0 10px',
      borderRadius: 'var(--radius-xs)',
      background: s.bg,
      color: s.fg,
      font: 'var(--fw-bold) var(--fs-micro)/1 var(--font-text)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '999px',
      background: 'currentColor'
    }
  }), children || s.label);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * MoustachirSpace primary button — the signature glossy blue pill.
 * Variants: primary (gradient + sheen), secondary (tint), ghost, danger.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  leadingIcon = null,
  trailingIcon = null,
  style = {},
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const sizes = {
    sm: {
      height: 40,
      padX: 18,
      font: 14
    },
    md: {
      height: 50,
      padX: 26,
      font: 15
    },
    lg: {
      height: 56,
      padX: 32,
      font: 16
    }
  };
  const s = sizes[size] || sizes.md;
  const base = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    height: s.height,
    padding: `0 ${s.padX}px`,
    width: full ? '100%' : 'auto',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    font: `var(--fw-bold) ${s.font}px/1 var(--font-text)`,
    letterSpacing: '0.01em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transition: 'transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
    transform: pressed && !disabled ? 'scale(var(--press-scale))' : 'scale(1)',
    opacity: disabled ? 0.55 : 1,
    WebkitTapHighlightColor: 'transparent'
  };
  const variants = {
    primary: {
      background: 'var(--grad-primary)',
      color: 'var(--color-on-primary)',
      boxShadow: disabled ? 'none' : pressed ? 'var(--shadow-btn-press)' : 'var(--shadow-btn)'
    },
    secondary: {
      background: 'var(--blue-50)',
      color: 'var(--blue-600)',
      boxShadow: 'inset 0 0 0 1px var(--blue-100)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-700)',
      boxShadow: 'inset 0 0 0 1px var(--line-200)'
    },
    danger: {
      background: 'var(--red-500)',
      color: '#fff',
      boxShadow: pressed ? 'none' : '0 6px 16px rgba(240,69,62,0.30)'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    style: {
      ...base,
      ...variants[variant],
      ...style
    }
  }, rest), variant === 'primary' && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      background: 'var(--gloss-overlay)',
      pointerEvents: 'none'
    }
  }), leadingIcon && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    }
  }, leadingIcon), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative'
    }
  }, children), trailingIcon && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    }
  }, trailingIcon));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Selectable chip used in feedback flows ("High Quality", "On Time", "Delays").
 * Selected = solid electric blue; idle = light grey card. Toggle with onToggle.
 */
function Chip({
  children,
  selected = false,
  onToggle,
  tone = 'blue',
  leadingIcon = null,
  disabled = false,
  style = {},
  ...rest
}) {
  const tones = {
    blue: {
      bg: 'var(--blue-500)',
      fg: '#fff'
    },
    orange: {
      bg: 'var(--orange-500)',
      fg: '#fff'
    },
    green: {
      bg: 'var(--green-500)',
      fg: '#fff'
    },
    ink: {
      bg: 'var(--ink-900)',
      fg: '#fff'
    }
  };
  const t = tones[tone] || tones.blue;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "checkbox",
    "aria-checked": selected,
    disabled: disabled,
    onClick: () => onToggle && onToggle(!selected),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 36,
      padding: '0 16px',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-text)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap',
      transition: 'background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)',
      background: selected ? t.bg : 'var(--surface-3)',
      color: selected ? t.fg : 'var(--ink-500)',
      boxShadow: selected ? 'var(--shadow-sm)' : 'inset 0 0 0 1px var(--line-200)',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), leadingIcon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      fontSize: 15
    }
  }, leadingIcon), children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Chip.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Circular / rounded icon-only button. Pass an icon node as children
 * (e.g. a Phosphor <i className="ph ph-bell" />).
 * Variants: plain, tint (blue-50), solid (electric blue), ghost.
 */
function IconButton({
  children,
  variant = 'plain',
  size = 'md',
  rounded = 'full',
  badge = false,
  disabled = false,
  ariaLabel,
  style = {},
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const dims = {
    sm: 36,
    md: 44,
    lg: 52
  }[size] || 44;
  const fontSize = {
    sm: 18,
    md: 20,
    lg: 24
  }[size] || 20;
  const variants = {
    plain: {
      background: 'transparent',
      color: 'var(--ink-700)'
    },
    tint: {
      background: 'var(--blue-50)',
      color: 'var(--blue-600)'
    },
    solid: {
      background: 'var(--blue-500)',
      color: '#fff',
      boxShadow: 'var(--glow-primary)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-700)',
      boxShadow: 'inset 0 0 0 1px var(--line-200)'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": ariaLabel,
    disabled: disabled,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    style: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dims,
      height: dims,
      flex: '0 0 auto',
      border: 'none',
      borderRadius: rounded === 'full' ? '999px' : 'var(--radius-md)',
      fontSize,
      lineHeight: 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transform: pressed && !disabled ? 'scale(0.92)' : 'scale(1)',
      transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-base) var(--ease-out)',
      WebkitTapHighlightColor: 'transparent',
      ...variants[variant],
      ...style
    }
  }, rest), children, badge && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: size === 'sm' ? 6 : 8,
      right: size === 'sm' ? 6 : 8,
      width: 8,
      height: 8,
      borderRadius: '999px',
      background: 'var(--blue-500)',
      boxShadow: '0 0 0 2px var(--white)'
    }
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Pill search field with a leading magnifier ("Name or mission ID…"). */
function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  onClear,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 46,
      padding: '0 14px',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-pill)',
      boxShadow: focused ? 'inset 0 0 0 1.5px var(--blue-500), var(--ring-focus)' : 'var(--shadow-sm), inset 0 0 0 1px var(--line-200)',
      transition: 'box-shadow var(--dur-base) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("i", {
    className: "ph ph-magnifying-glass",
    style: {
      fontSize: 18,
      color: 'var(--ink-400)'
    },
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--fw-medium) var(--fs-body)/1 var(--font-text)',
      color: 'var(--ink-900)'
    }
  }), value && onClear && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClear,
    "aria-label": "Clear",
    style: {
      border: 'none',
      background: 'transparent',
      color: 'var(--ink-400)',
      fontSize: 16,
      cursor: 'pointer',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-x-circle",
    "aria-hidden": "true"
  })));
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Segmented control — pill track with a sliding electric-blue thumb
 * ("Verbally | Online Chat"). 2–4 short options.
 */
function SegmentedControl({
  options = [],
  value,
  onChange,
  style = {},
  ...rest
}) {
  const items = options.map(o => typeof o === 'string' ? {
    label: o,
    value: o
  } : o);
  const idx = Math.max(0, items.findIndex(i => i.value === value));
  const n = items.length || 1;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      display: 'flex',
      padding: 4,
      background: 'var(--surface-3)',
      borderRadius: 'var(--radius-pill)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: 4,
      width: `calc((100% - 8px) / ${n})`,
      transform: `translateX(${idx * 100}%)`,
      background: 'var(--grad-primary)',
      borderRadius: 'var(--radius-pill)',
      boxShadow: 'var(--shadow-btn)',
      transition: 'transform var(--dur-base) var(--ease-spring)'
    }
  }), items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      onClick: () => onChange && onChange(it.value),
      style: {
        position: 'relative',
        flex: 1,
        height: 38,
        border: 'none',
        background: 'transparent',
        borderRadius: 'var(--radius-pill)',
        font: 'var(--fw-bold) var(--fs-sm)/1 var(--font-text)',
        color: active ? '#fff' : 'var(--ink-500)',
        cursor: 'pointer',
        transition: 'color var(--dur-base) var(--ease-out)',
        WebkitTapHighlightColor: 'transparent',
        whiteSpace: 'nowrap'
      }
    }, it.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Dropdown in the card style (e.g. "Lead Source · Event / Expo").
 * Optional leading icon; native <select> for accessibility, custom chrome.
 */
function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  leadingIcon = null,
  disabled = false,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      background: disabled ? 'var(--surface-3)' : 'var(--surface-card)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      boxShadow: focused ? 'inset 0 0 0 1.5px var(--blue-500), var(--ring-focus)' : 'var(--shadow-sm), inset 0 0 0 1px var(--line-200)',
      transition: 'box-shadow var(--dur-base) var(--ease-out)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      ...style
    }
  }, rest), leadingIcon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 34,
      height: 34,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--blue-50)',
      color: 'var(--blue-500)',
      fontSize: 18
    }
  }, leadingIcon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      font: 'var(--fw-medium) var(--fs-label)/1 var(--font-text)',
      color: 'var(--ink-400)',
      marginBottom: 4
    }
  }, label), /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      width: '100%',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      appearance: 'none',
      WebkitAppearance: 'none',
      font: 'var(--fw-semibold) var(--fs-body)/1.3 var(--font-text)',
      color: value ? 'var(--ink-900)' : 'var(--ink-400)',
      padding: 0,
      cursor: 'pointer'
    }
  }, placeholder && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder), options.map(o => {
    const val = typeof o === 'string' ? o : o.value;
    const lab = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: val,
      value: val
    }, lab);
  }))), /*#__PURE__*/React.createElement("i", {
    className: "ph ph-caret-down",
    style: {
      color: 'var(--ink-400)',
      fontSize: 16,
      flex: '0 0 auto'
    },
    "aria-hidden": "true"
  }));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Signature MoustachirSpace field — a white "card" input with the label
 * sitting small + grey above the value. Soft shadow, focuses to a blue ring.
 */
function TextField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  trailingIcon = null,
  onTrailingClick,
  error = '',
  disabled = false,
  style = {},
  inputProps = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const hasError = !!error;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: '100%',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      background: disabled ? 'var(--surface-3)' : 'var(--surface-card)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      boxShadow: hasError ? 'inset 0 0 0 1.5px var(--red-500)' : focused ? 'inset 0 0 0 1.5px var(--blue-500), var(--ring-focus)' : 'var(--shadow-sm), inset 0 0 0 1px var(--line-200)',
      transition: 'box-shadow var(--dur-base) var(--ease-out)',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      font: 'var(--fw-medium) var(--fs-label)/1 var(--font-text)',
      color: hasError ? 'var(--red-500)' : 'var(--ink-400)',
      marginBottom: 4
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      width: '100%',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--fw-semibold) var(--fs-body)/1.3 var(--font-text)',
      color: 'var(--ink-900)',
      padding: 0
    }
  }, inputProps))), trailingIcon && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onTrailingClick,
    tabIndex: onTrailingClick ? 0 : -1,
    "aria-hidden": !onTrailingClick,
    style: {
      border: 'none',
      background: 'transparent',
      color: 'var(--ink-400)',
      cursor: onTrailingClick ? 'pointer' : 'default',
      fontSize: 20,
      display: 'inline-flex',
      padding: 4
    }
  }, trailingIcon)), hasError && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-medium) var(--fs-label)/1.4 var(--font-text)',
      color: 'var(--red-500)',
      marginTop: 6,
      paddingLeft: 4
    }
  }, error));
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextField.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Multi-line note field in the same card style as TextField (Notes, etc). */
function Textarea({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  disabled = false,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: '100%',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      background: disabled ? 'var(--surface-3)' : 'var(--surface-card)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      boxShadow: focused ? 'inset 0 0 0 1.5px var(--blue-500), var(--ring-focus)' : 'var(--shadow-sm), inset 0 0 0 1px var(--line-200)',
      transition: 'box-shadow var(--dur-base) var(--ease-out)'
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      font: 'var(--fw-medium) var(--fs-label)/1 var(--font-text)',
      color: 'var(--ink-400)',
      marginBottom: 6
    }
  }, label), /*#__PURE__*/React.createElement("textarea", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    rows: rows,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      width: '100%',
      border: 'none',
      outline: 'none',
      resize: 'vertical',
      background: 'transparent',
      font: 'var(--fw-medium) var(--fs-body)/1.6 var(--font-text)',
      color: 'var(--ink-900)',
      padding: 0,
      display: 'block'
    }
  })));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/layout/AppHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * App top bar. Two layouts:
 *  · variant="title"    — leading (back) · centered title · trailing
 *  · variant="greeting" — avatar · "Merhba," + name · trailing
 */
function AppHeader({
  variant = 'title',
  title = '',
  greeting = 'Merhba,',
  name = '',
  leading = null,
  trailing = null,
  avatar = null,
  style = {},
  ...rest
}) {
  if (variant === 'greeting') {
    return /*#__PURE__*/React.createElement("header", _extends({
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 'var(--space-4)',
        ...style
      }
    }, rest), avatar, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-text)',
        color: 'var(--ink-400)'
      }
    }, greeting), /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'var(--fw-bold) var(--fs-h2)/1.15 var(--font-display)',
        letterSpacing: '-0.02em',
        color: 'var(--ink-900)',
        marginTop: 3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, name)), trailing);
  }
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      display: 'grid',
      gridTemplateColumns: '44px 1fr 44px',
      alignItems: 'center',
      padding: 'var(--space-3) var(--space-4)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      justifySelf: 'start'
    }
  }, leading), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      justifySelf: 'center',
      font: 'var(--fw-bold) var(--fs-h1)/1.2 var(--font-display)',
      letterSpacing: '-0.02em',
      color: 'var(--ink-900)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      justifySelf: 'end'
    }
  }, trailing));
}
Object.assign(__ds_scope, { AppHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/AppHeader.jsx", error: String((e && e.message) || e) }); }

// components/layout/BottomNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Bottom tab bar with a centre raised electric-blue FAB.
 * Pass up to 4 nav `items` (they flank the FAB) plus FAB handlers.
 * Each item: { key, icon, iconActive?, label? }.
 */
function BottomNav({
  items = [],
  active,
  onSelect,
  onFab,
  fabIcon = null,
  style = {},
  ...rest
}) {
  const left = items.slice(0, Math.ceil(items.length / 2));
  const right = items.slice(Math.ceil(items.length / 2));
  const Tab = ({
    it
  }) => {
    const on = it.key === active;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onSelect && onSelect(it.key),
      "aria-label": it.label || it.key,
      "aria-current": on ? 'page' : undefined,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: on ? 'var(--blue-500)' : 'var(--ink-300)',
        fontSize: 24,
        padding: '6px 0',
        transition: 'color var(--dur-base) var(--ease-out)',
        WebkitTapHighlightColor: 'transparent'
      }
    }, on && it.iconActive ? it.iconActive : it.icon, it.label && /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--fw-semibold) 10px/1 var(--font-text)'
      }
    }, it.label));
  };
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: 'var(--nav-h)',
      padding: '0 12px',
      background: 'var(--surface-card)',
      boxShadow: '0 -6px 24px rgba(21,35,63,0.07)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flex: 1
    }
  }, left.map(it => /*#__PURE__*/React.createElement(Tab, {
    key: it.key,
    it: it
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 76,
      flex: '0 0 auto',
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onFab,
    "aria-label": "Create",
    style: {
      width: 56,
      height: 56,
      marginTop: -26,
      borderRadius: '999px',
      border: '4px solid var(--surface-card)',
      background: 'var(--blue-500)',
      color: '#fff',
      fontSize: 26,
      boxShadow: 'var(--glow-primary)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      WebkitTapHighlightColor: 'transparent'
    }
  }, fabIcon || /*#__PURE__*/React.createElement("i", {
    className: "ph ph-plus",
    "aria-hidden": "true"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flex: 1
    }
  }, right.map(it => /*#__PURE__*/React.createElement(Tab, {
    key: it.key,
    it: it
  }))));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/layout/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Generic surface container. `tone` picks the fill; optional title/action header.
 */
function Card({
  children,
  tone = 'white',
  title = null,
  action = null,
  padding = 16,
  style = {},
  ...rest
}) {
  const tones = {
    white: {
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)'
    },
    tint: {
      background: 'var(--surface-tint)',
      boxShadow: 'none'
    },
    sunken: {
      background: 'var(--surface-3)',
      boxShadow: 'none'
    },
    outline: {
      background: 'var(--surface-card)',
      boxShadow: 'inset 0 0 0 1px var(--line-200)'
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderRadius: 'var(--radius-lg)',
      padding,
      ...tones[tone],
      ...style
    }
  }, rest), (title || action) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: 'var(--fw-bold) var(--fs-h3)/1.2 var(--font-display)',
      letterSpacing: '-0.01em',
      color: 'var(--ink-900)'
    }
  }, title), action), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Card.jsx", error: String((e && e.message) || e) }); }

// ui_kits/moustachir-app/DashboardScreen.jsx
try { (() => {
/* global React */
// MoustachirSpace · Dashboard — greeting, stats, activity, missions.
function DashboardScreen({
  onOpenMission
}) {
  const NS = window.MoustachirSpaceDesignSystem_d4c8ce;
  const {
    AppHeader,
    IconButton,
    Avatar,
    StatCard,
    ListRow,
    StatusPill,
    ProgressRing
  } = NS;
  const Section = ({
    title,
    count,
    children
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: 'var(--fw-bold) var(--fs-h2)/1 var(--font-display)',
      letterSpacing: '-0.02em',
      color: 'var(--ink-900)'
    }
  }, title), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) 13px var(--font-text)',
      color: 'var(--blue-500)'
    }
  }, count)), children);
  const ActivityCard = ({
    tag,
    icon,
    tone,
    name,
    time
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 64%',
      background: 'var(--surface-tint)',
      borderRadius: 'var(--radius-md)',
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 12px var(--font-text)',
      color: 'var(--ink-500)'
    }
  }, tag), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 8,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: tone === 'blue' ? 'var(--blue-500)' : 'var(--white)',
      color: tone === 'blue' ? '#fff' : 'var(--blue-500)',
      fontSize: 14,
      boxShadow: tone === 'blue' ? 'none' : 'var(--shadow-xs)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: icon
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) 16px/1.2 var(--font-text)',
      color: 'var(--ink-900)',
      marginTop: 14
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-medium) 12px var(--font-text)',
      color: 'var(--ink-400)',
      marginTop: 6
    }
  }, time));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflowY: 'auto',
      background: 'var(--surface-2)'
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    variant: "greeting",
    name: "Khaled Ferroukhi",
    avatar: /*#__PURE__*/React.createElement(Avatar, {
      name: "Khaled Ferroukhi",
      size: 46,
      src: "https://i.pravatar.cc/96?img=12"
    }),
    trailing: /*#__PURE__*/React.createElement(IconButton, {
      variant: "plain",
      badge: true,
      ariaLabel: "Notifications"
    }, /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-bell"
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 16px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Leads Added",
    value: "14",
    delta: "+3 vs last week",
    deltaTone: "up",
    watermark: /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-seal-check"
    })
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Avg. Feedback",
    value: "4.2",
    unit: "\u2605",
    delta: "From 8 Clients",
    deltaTone: "flat",
    watermark: /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-medal"
    })
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Recent Activity",
    count: "2"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      overflowX: 'auto',
      margin: '0 -16px',
      padding: '2px 16px',
      scrollbarWidth: 'none'
    }
  }, /*#__PURE__*/React.createElement(ActivityCard, {
    tag: "Lead Added",
    icon: "ph-fill ph-user-plus",
    tone: "blue",
    name: "Parapharm Expo",
    time: "2h ago"
  }), /*#__PURE__*/React.createElement(ActivityCard, {
    tag: "Feedback Collected",
    icon: "ph-fill ph-chat-circle-dots",
    tone: "white",
    name: "Abderrahmane Ammali",
    time: "Yesterday"
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "My Missions",
    count: "3"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    icon: /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-globe-hemisphere-west"
    }),
    iconTone: "blue",
    title: "Website dev \u2014 Lazzouzi Lyna",
    subtitle: /*#__PURE__*/React.createElement(StatusPill, {
      status: "progress"
    }),
    meta: "#MC-0418",
    trailing: /*#__PURE__*/React.createElement(ProgressRing, {
      value: 70,
      tone: "blue"
    }),
    onClick: () => onOpenMission && onOpenMission()
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-palette"
    }),
    iconTone: "ink",
    title: "Branding \u2014 Fernane Mourad I.",
    subtitle: /*#__PURE__*/React.createElement(StatusPill, {
      status: "scheduled"
    }),
    meta: "#MC-0422",
    trailing: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-caret-right",
      style: {
        fontSize: 18,
        color: 'var(--ink-300)'
      }
    }),
    onClick: () => onOpenMission && onOpenMission()
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-graduation-cap"
    }),
    iconTone: "orange",
    title: "Academy Platform \u2014 Amiar M.",
    subtitle: /*#__PURE__*/React.createElement(StatusPill, {
      status: "delayed"
    }),
    meta: "#MC-0031",
    trailing: /*#__PURE__*/React.createElement(ProgressRing, {
      value: 87,
      tone: "orange"
    }),
    onClick: () => onOpenMission && onOpenMission()
  })))));
}
window.DashboardScreen = DashboardScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/moustachir-app/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/moustachir-app/FeedbackScreen.jsx
try { (() => {
/* global React */
// MoustachirSpace · Client Feedback capture.
function FeedbackScreen({
  onBack,
  onSubmit
}) {
  const NS = window.MoustachirSpaceDesignSystem_d4c8ce;
  const {
    AppHeader,
    IconButton,
    SearchField,
    SegmentedControl,
    StarRating,
    Chip,
    Textarea,
    Button,
    StatusPill
  } = NS;
  const {
    useState
  } = React;
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('Verbally');
  const [rating, setRating] = useState(4);
  const [wins, setWins] = useState({
    quality: true,
    ontime: true,
    pricing: false
  });
  const [issues, setIssues] = useState({
    scope: true,
    delays: false,
    other: false
  });
  const [notes, setNotes] = useState('');
  const FieldLabel = ({
    children
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 13px var(--font-text)',
      color: 'var(--ink-500)',
      margin: '4px 0 2px'
    }
  }, children);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--surface-2)'
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    variant: "title",
    title: "Client Feedback",
    leading: /*#__PURE__*/React.createElement(IconButton, {
      variant: "plain",
      ariaLabel: "Back",
      onClick: onBack
    }, /*#__PURE__*/React.createElement("i", {
      className: "ph ph-arrow-left"
    })),
    trailing: /*#__PURE__*/React.createElement(IconButton, {
      variant: "plain",
      badge: true,
      ariaLabel: "Notifications"
    }, /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-bell"
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '6px 16px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(SearchField, {
    value: q,
    onChange: e => setQ(e.target.value),
    onClear: () => setQ(''),
    placeholder: "Name or mission ID\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-md)',
      padding: 14,
      boxShadow: 'var(--shadow-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) 16px var(--font-text)',
      color: 'var(--ink-900)'
    }
  }, "Ahmed Assem Meddah"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 12px var(--font-text)',
      color: 'var(--ink-400)'
    }
  }, "Portfolio Website \xB7 #MC-0421"), /*#__PURE__*/React.createElement(StatusPill, {
    status: "done"
  }, "Completed 2d ago"))), /*#__PURE__*/React.createElement(SegmentedControl, {
    value: mode,
    onChange: setMode,
    options: ['Verbally', 'Online Chat']
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FieldLabel, null, "Overall satisfaction"), /*#__PURE__*/React.createElement(StarRating, {
    value: rating,
    onChange: setRating,
    size: 30
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FieldLabel, null, "What went well the most?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    selected: wins.quality,
    onToggle: v => setWins({
      ...wins,
      quality: v
    })
  }, "High Quality"), /*#__PURE__*/React.createElement(Chip, {
    selected: wins.ontime,
    onToggle: v => setWins({
      ...wins,
      ontime: v
    })
  }, "On Time"), /*#__PURE__*/React.createElement(Chip, {
    selected: wins.pricing,
    onToggle: v => setWins({
      ...wins,
      pricing: v
    })
  }, "Pricing"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FieldLabel, null, "Any issues raised?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    tone: "orange",
    selected: issues.scope,
    onToggle: v => setIssues({
      ...issues,
      scope: v
    })
  }, "Unclear Scope"), /*#__PURE__*/React.createElement(Chip, {
    tone: "orange",
    selected: issues.delays,
    onToggle: v => setIssues({
      ...issues,
      delays: v
    })
  }, "Delays"), /*#__PURE__*/React.createElement(Chip, {
    tone: "ink",
    selected: issues.other,
    onToggle: v => setIssues({
      ...issues,
      other: v
    })
  }, "Other"))), /*#__PURE__*/React.createElement(Textarea, {
    label: "Notes",
    rows: 4,
    value: notes,
    onChange: e => setNotes(e.target.value),
    placeholder: "Anything else worth recording\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px 18px',
      background: 'linear-gradient(to top, var(--surface-2) 70%, transparent)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    full: true,
    size: "lg",
    onClick: onSubmit,
    leadingIcon: /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-paper-plane-tilt"
    })
  }, "Submit")));
}
window.FeedbackScreen = FeedbackScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/moustachir-app/FeedbackScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/moustachir-app/LoginScreen.jsx
try { (() => {
/* global React */
// MoustachirSpace · Login screen — navy "space" hero + glossy form.
function LoginScreen({
  onLogin
}) {
  const {
    TextField,
    Button
  } = window.MoustachirSpaceDesignSystem_d4c8ce;
  const {
    useState
  } = React;
  const [email, setEmail] = useState('thehicore@outlook.com');
  const [pw, setPw] = useState('secret123');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--white)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--grad-hero)',
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26,
      padding: '64px 26px 30px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ms-stars",
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/moustachir-logo-white.png",
    alt: "MoustachirSpace",
    style: {
      height: 30,
      position: 'relative',
      marginBottom: 26
    }
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      position: 'relative',
      margin: 0,
      color: '#fff',
      font: 'var(--fw-bold) 30px/1.12 var(--font-display)',
      letterSpacing: '-0.02em'
    }
  }, "Sign in to your", /*#__PURE__*/React.createElement("br", null), "MousSpace Account")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '26px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Email",
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value)
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Password",
    type: show ? 'text' : 'password',
    value: pw,
    onChange: e => setPw(e.target.value),
    trailingIcon: /*#__PURE__*/React.createElement("i", {
      className: show ? 'ph ph-eye-slash' : 'ph ph-eye'
    }),
    onTrailingClick: () => setShow(!show)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      font: 'var(--fw-medium) 13px var(--font-text)',
      color: 'var(--ink-500)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => setRemember(!remember),
    style: {
      width: 20,
      height: 20,
      borderRadius: 6,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: remember ? 'var(--blue-500)' : 'var(--white)',
      boxShadow: remember ? 'none' : 'inset 0 0 0 1.5px var(--line-300)',
      color: '#fff',
      fontSize: 13,
      transition: 'all var(--dur-base) var(--ease-out)'
    }
  }, remember && /*#__PURE__*/React.createElement("i", {
    className: "ph-bold ph-check"
  })), "Remember me"), /*#__PURE__*/React.createElement("a", {
    style: {
      font: 'var(--fw-semibold) 13px var(--font-text)',
      color: 'var(--blue-500)',
      textDecoration: 'none',
      cursor: 'pointer'
    }
  }, "Forgot Password?")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    full: true,
    size: "lg",
    style: {
      marginTop: 4
    },
    onClick: onLogin
  }, "Log In")));
}
window.LoginScreen = LoginScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/moustachir-app/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/moustachir-app/NewLeadScreen.jsx
try { (() => {
/* global React */
// MoustachirSpace · New Lead form.
function NewLeadScreen({
  onBack,
  onSubmit
}) {
  const NS = window.MoustachirSpaceDesignSystem_d4c8ce;
  const {
    AppHeader,
    IconButton,
    TextField,
    Select,
    Textarea,
    Button
  } = NS;
  const {
    useState
  } = React;
  const [f, setF] = useState({
    name: 'Houssem Eddine Bouslimane',
    project: 'HealthCare Resilience',
    sector: 'Medical',
    phone: '(+213) 999 99 99 99',
    email: '',
    source: 'Event / Expo',
    state: 'Beginning',
    notes: ''
  });
  const set = k => e => setF({
    ...f,
    [k]: e.target.value
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--surface-2)'
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    variant: "title",
    title: "New Lead",
    leading: /*#__PURE__*/React.createElement(IconButton, {
      variant: "plain",
      ariaLabel: "Back",
      onClick: onBack
    }, /*#__PURE__*/React.createElement("i", {
      className: "ph ph-arrow-left"
    })),
    trailing: /*#__PURE__*/React.createElement(IconButton, {
      variant: "plain",
      badge: true,
      ariaLabel: "Notifications"
    }, /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-bell"
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '6px 16px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Full Name",
    value: f.name,
    onChange: set('name')
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Project Name",
    value: f.project,
    onChange: set('project')
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Project Sector",
    value: f.sector,
    onChange: set('sector')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Phone Number",
    value: f.phone,
    onChange: set('phone')
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Email Address",
    value: f.email,
    onChange: set('email'),
    placeholder: "name@email.com"
  })), /*#__PURE__*/React.createElement(Select, {
    label: "Lead Source",
    value: f.source,
    onChange: set('source'),
    leadingIcon: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-megaphone-simple"
    }),
    options: ['Event / Expo', 'Referral', 'Website', 'Cold Outreach', 'Social']
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Project State",
    value: f.state,
    onChange: set('state'),
    leadingIcon: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-flag-banner"
    }),
    options: ['Beginning', 'Scoping', 'Proposal Sent', 'Won', 'Lost']
  }), /*#__PURE__*/React.createElement(Textarea, {
    label: "Notes",
    rows: 4,
    value: f.notes,
    onChange: set('notes'),
    placeholder: "Context, scope, next steps\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px 18px',
      background: 'linear-gradient(to top, var(--surface-2) 70%, transparent)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    full: true,
    size: "lg",
    onClick: onSubmit,
    leadingIcon: /*#__PURE__*/React.createElement("i", {
      className: "ph-fill ph-paper-plane-tilt"
    })
  }, "Submit")));
}
window.NewLeadScreen = NewLeadScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/moustachir-app/NewLeadScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.ProgressRing = __ds_scope.ProgressRing;

__ds_ns.StarRating = __ds_scope.StarRating;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.AppHeader = __ds_scope.AppHeader;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.Card = __ds_scope.Card;

})();
