import { useEffect, useRef, useState } from 'react';
import { clamp, fmtShort } from '../geometry/math';

interface NumProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/** Champ numérique acceptant la virgule décimale ; flèches haut/bas pour incrémenter. */
export function NumField({ label, value, onChange, min = -1e6, max = 1e6, step = 0.1, unit }: NumProps) {
  const [text, setText] = useState(fmtShort(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(fmtShort(value));
  }, [value]);
  const commit = (t: string) => {
    const v = parseFloat(t.replace(',', '.'));
    if (!Number.isNaN(v)) onChange(clamp(v, min, max));
  };
  return (
    <label className="field">
      <span>{label}</span>
      <div className="num">
        <input
          value={text}
          inputMode="decimal"
          onFocus={(e) => {
            focused.current = true;
            e.target.select();
          }}
          onChange={(e) => {
            setText(e.target.value);
            commit(e.target.value);
          }}
          onBlur={() => {
            focused.current = false;
            setText(fmtShort(value));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              const v = clamp(Math.round((value + (e.key === 'ArrowUp' ? step : -step)) * 1000) / 1000, min, max);
              onChange(v);
              setText(fmtShort(v));
            }
          }}
        />
        {unit && <em>{unit}</em>}
      </div>
    </label>
  );
}

export function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="field check">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function SelectField<T extends string | number>({
  label, value, options, onChange,
}: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={String(value)}
        onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)!.value)}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function RangeField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="range">
        <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
        <em>{Math.round(value * 100)} %</em>
      </div>
    </label>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}
