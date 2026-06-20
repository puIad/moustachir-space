/**
 * components/forms/ModalForm.tsx — schema-driven modal form engine.
 *
 * Takes a list of FieldDef (from formSchemas.ts) and renders a DS-styled
 * overlay form with validation, FR/EN labels, and a submit/cancel pair.
 *
 * Design direction: Dense Command Interface — crisp dark overlay, tight
 * section headers, professional data-entry feel matching the analytics UI.
 */

import React, { useState, useCallback } from 'react';
import { TextField } from '@/design-system/components/TextField';
import { Select } from '@/design-system/components/Select';
import { Textarea } from '@/design-system/components/Textarea';
import { Button } from '@/design-system/components/Button';
import { getPricingForService } from '@/lib/pricing';

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Field definition types
 * ─────────────────────────────────────────────────────────────────────────── */

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'pricing';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  /** Select options (string | {label, value}) */
  options?: Array<string | { label: string; value: string }>;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  /** For type='pricing': which form field holds the serviceLine value */
  serviceLineField?: string;
  defaultValue?: string;
}

export interface FormSection {
  title?: string;
  fields: FieldDef[];
}

export interface ModalFormProps {
  title: string;
  sections: FormSection[];
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  onClose: () => void;
  accentColor?: string;
  submitLabel?: string;
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  PricingField — shows pricing options for a service line
 * ─────────────────────────────────────────────────────────────────────────── */

function PricingField({
  field,
  serviceLine,
  value,
  onChange,
}: {
  field: FieldDef;
  serviceLine: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const rows = getPricingForService(serviceLine);
  if (!rows.length) return null;

  const options = rows.map((r) => ({
    label: `${r.item} — ${r.tier} : ${r.basePriceDa.toLocaleString('fr-FR')} DA`,
    value: String(r.basePriceDa),
  }));

  return (
    <Select
      label={field.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      placeholder="Choisir un tarif…"
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Main ModalForm
 * ─────────────────────────────────────────────────────────────────────────── */

export function ModalForm({
  title,
  sections,
  initialValues = {},
  onSubmit,
  onClose,
  accentColor = 'var(--blue-500)',
  submitLabel = 'Enregistrer',
}: ModalFormProps) {
  const allFields = sections.flatMap((s) => s.fields);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of allFields) {
      init[f.key] = initialValues[f.key] ?? f.defaultValue ?? '';
    }
    return init;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = useCallback((key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    for (const f of allFields) {
      if (f.required && !values[f.key]?.trim()) {
        errs[f.key] = 'Champ requis';
      }
      if (f.type === 'number' && values[f.key] && isNaN(Number(values[f.key]))) {
        errs[f.key] = 'Nombre invalide';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setErrors({ _form: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Backdrop */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,14,30,0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 120ms ease-out',
      }}
    >
      {/* Panel */}
      <div
        style={{
          background: 'var(--surface-1)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 4, height: 20, borderRadius: 2,
              background: accentColor, flexShrink: 0,
            }} />
            <span style={{ font: '600 15px/1.2 var(--font-text)', color: 'var(--ink-100)' }}>
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-400)', fontSize: 20, padding: 4, borderRadius: 4,
              display: 'inline-flex',
            }}
          >
            <i className="ph ph-x" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {sections.map((section, si) => (
            <div key={si} style={{ marginBottom: si < sections.length - 1 ? 24 : 0 }}>
              {section.title && (
                <div style={{
                  font: '500 11px/1 var(--font-mono)',
                  color: 'var(--ink-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: `1px solid ${accentColor}22`,
                }}>
                  {section.title}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {section.fields.map((field) => (
                  <div key={field.key}>
                    {field.type === 'select' ? (
                      <Select
                        label={field.label}
                        value={values[field.key]}
                        onChange={(e) => set(field.key, e.target.value)}
                        options={field.options ?? []}
                        placeholder={field.placeholder ?? 'Choisir…'}
                      />
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        label={field.label}
                        value={values[field.key]}
                        onChange={(e) => set(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    ) : field.type === 'pricing' ? (
                      <PricingField
                        field={field}
                        serviceLine={field.serviceLineField ? values[field.serviceLineField] : ''}
                        value={values[field.key]}
                        onChange={(v) => set(field.key, v)}
                      />
                    ) : (
                      <TextField
                        label={field.label}
                        value={values[field.key]}
                        onChange={(e) => set(field.key, e.target.value)}
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        placeholder={field.placeholder}
                        error={errors[field.key]}
                        inputProps={field.type === 'number' ? {
                          min: field.min,
                          max: field.max,
                          step: 1,
                        } : {}}
                      />
                    )}
                    {errors[field.key] && field.type !== 'text' && (
                      <div style={{ font: 'var(--fw-medium) var(--fs-label)/1.4 var(--font-text)', color: 'var(--red-500)', marginTop: 4, paddingLeft: 4 }}>
                        {errors[field.key]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {errors._form && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: 'var(--red-50)', borderRadius: 'var(--radius-md)',
              font: '500 13px/1.4 var(--font-text)', color: 'var(--red-700)',
              border: '1px solid var(--red-200)',
            }}>
              {errors._form}
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)',
          flexShrink: 0,
        }}>
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSubmit as never}
            disabled={submitting}
            style={{ background: accentColor, minWidth: 120 }}
          >
            {submitting ? 'Enregistrement…' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
