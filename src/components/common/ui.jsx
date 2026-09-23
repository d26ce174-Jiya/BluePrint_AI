/**
 * ui.jsx — Shadcn-style primitive components
 *
 * Usage examples:
 *   <Button variant="primary" size="lg">Get started</Button>
 *   <Card className="p-6"><CardHeader>...</CardHeader></Card>
 *   <Badge variant="primary">New</Badge>
 *   <Input placeholder="Enter email..." />
 */

/* ─── Icon helper ─── */
export function Icon({ d, size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d={d} />
    </svg>
  );
}

/* ─── Button ─── */
const BTN_BASE = 'inline-flex items-center justify-center gap-2 font-semibold text-sm leading-none rounded-[var(--radius)] border border-transparent cursor-pointer transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const BTN_VARIANTS = {
  primary:    'bg-primary text-primary-foreground shadow-primary hover:opacity-90 hover:-translate-y-px active:translate-y-0',
  gradient:   'bg-[var(--grad)] text-white border-none shadow-primary hover:shadow-[var(--shadow-primary)] hover:opacity-95 hover:-translate-y-px active:translate-y-0',
  outline:    'bg-card text-foreground border-border shadow-xs hover:bg-secondary hover:border-ring/40',
  ghost:      'bg-transparent border-none text-muted-foreground hover:bg-secondary hover:text-foreground shadow-none',
  secondary:  'bg-secondary text-secondary-foreground border-border/50 hover:bg-muted',
  destructive:'bg-destructive text-destructive-foreground hover:opacity-90',
};

const BTN_SIZES = {
  sm:      'px-3 py-1.5 text-xs rounded-sm gap-1.5',
  default: 'px-4 py-2.5',
  lg:      'px-6 py-3.5 text-base gap-2.5 rounded-md',
  xl:      'px-8 py-4 text-base gap-3 rounded-md',
  icon:    'h-9 w-9 p-0',
};

export function Button({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[BTN_BASE, BTN_VARIANTS[variant] || BTN_VARIANTS.primary, BTN_SIZES[size] || BTN_SIZES.default, className].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ─── Card ─── */
export function Card({ children, className = '', hover = false, style = {}, onClick }) {
  const base = 'bg-card border border-border rounded-lg shadow-sm';
  const hoverClass = hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-px hover:border-ring/25 cursor-pointer' : '';
  return (
    <div className={[base, hoverClass, className].join(' ')} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={['px-6 pt-6 pb-2', className].join(' ')}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
  return <div className={['px-6 py-4', className].join(' ')}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={['px-6 pt-2 pb-6 flex items-center gap-3', className].join(' ')}>
      {children}
    </div>
  );
}

/* ─── Badge ─── */
const BADGE_VARIANTS = {
  primary:  'bg-primary/10 text-primary border border-primary/20',
  accent:   'bg-accent/10 text-accent border border-accent/20',
  success:  'bg-green-500/10 text-green-700 border border-green-500/20',
  warn:     'bg-amber-500/10 text-amber-700 border border-amber-500/20',
  danger:   'bg-destructive/10 text-destructive border border-destructive/20',
  neutral:  'bg-secondary text-secondary-foreground border border-border',
  outline:  'bg-transparent text-foreground border border-border',
};

export function Badge({ children, variant = 'primary', className = '' }) {
  const base = 'inline-flex items-center gap-1 text-2xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide leading-none';
  return (
    <span className={[base, BADGE_VARIANTS[variant] || BADGE_VARIANTS.primary, className].join(' ')}>
      {children}
    </span>
  );
}

/* ─── Input ─── */
export function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  error,
  prefix,
  suffix,
  id,
  ...rest
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-muted-foreground pointer-events-none">{prefix}</span>
        )}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={[
            'w-full px-3.5 py-2.5 border rounded-[var(--radius)] bg-card text-foreground text-[0.9375rem] placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all duration-150',
            error ? 'border-destructive focus:ring-destructive/25' : 'border-border',
            prefix ? 'pl-10' : '',
            suffix ? 'pr-10' : '',
            className,
          ].join(' ')}
          {...rest}
        />
        {suffix && (
          <span className="absolute right-3 text-muted-foreground">{suffix}</span>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive font-medium flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Separator ─── */
export function Separator({ className = '' }) {
  return <hr className={['border-none h-px bg-border', className].join(' ')} />;
}

/* ─── Spinner ─── */
export function Spinner({ size = 18, className = '' }) {
  return (
    <svg
      className={['animate-spin', className].join(' ')}
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ─── Avatar ─── */
export function Avatar({ name = '', size = 32, gradient = true, className = '' }) {
  const initials = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div
      className={['flex items-center justify-center rounded-full text-white font-bold select-none', className].join(' ')}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: gradient ? 'var(--grad)' : 'hsl(var(--primary))',
      }}
    >
      {initials}
    </div>
  );
}

/* ─── Section wrapper ─── */
export function Section({ children, className = '', id }) {
  return (
    <section id={id} className={['py-20 px-6 sm:px-8', className].join(' ')}>
      <div className="max-w-[1120px] mx-auto w-full">
        {children}
      </div>
    </section>
  );
}

/* ─── GradientText ─── */
export function GradientText({ children, className = '' }) {
  return (
    <span
      className={['bg-clip-text', className].join(' ')}
      style={{
        background: 'var(--grad)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  );
}

/* ─── GlassPanel ─── */
export function GlassPanel({ children, className = '', style = {} }) {
  return (
    <div
      className={['rounded-2xl border border-border/60', className].join(' ')}
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-lg)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
