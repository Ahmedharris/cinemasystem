import { useEffect, useState } from 'react';
import Modal from './Modal';
import { Spinner } from './Misc';

export function Field({ label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}{required && <span className="text-bad ml-0.5">*</span>}</label>}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

const isEmpty = (v) => v === '' || v == null || (Array.isArray(v) && !v.length);

/** Schema-driven modal form used by all admin CRUD screens. */
export function FormModal({ open, title, subtitle, fields, initial = {}, onSubmit, onClose, submitText = 'Save', size = 'md', derive, children }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      const v = {};
      fields.forEach((f) => { v[f.name] = initial[f.name] ?? (f.type === 'multi' ? [] : f.type === 'checkbox' ? false : ''); });
      setValues(derive ? { ...v, ...derive(v, null) } : v);
      setErrors({}); setFormError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (name, value) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      return derive ? { ...next, ...derive(next, name) } : next;
    });
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    const out = {};
    fields.forEach((f) => {
      if (f.hidden && f.hidden(values)) return;
      let v = values[f.name];
      if (f.required && isEmpty(v)) errs[f.name] = 'This field is required.';
      else if (f.type === 'number' && !isEmpty(v)) {
        const n = Number(v);
        if (Number.isNaN(n)) errs[f.name] = 'Enter a valid number.';
        else if (f.min != null && n < f.min) errs[f.name] = `Must be at least ${f.min}.`;
        else if (f.max != null && n > f.max) errs[f.name] = `Must be at most ${f.max}.`;
        v = n;
      } else if (f.type === 'number') v = null;
      else if (f.type === 'select' && f.numeric) v = isEmpty(v) ? null : Number(v);
      else if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) errs[f.name] = 'Enter a valid email address.';
      if (!errs[f.name] && f.validate) { const m = f.validate(v, values); if (m) errs[f.name] = m; }
      out[f.name] = typeof v === 'string' ? v.trim() : v;
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setFormError('');
    try {
      const res = await onSubmit(out);
      if (res !== false) onClose();
    } catch (err) {
      setFormError(err.userMessage || err.message || 'Could not save.');
    } finally { setBusy(false); }
  };

  const render = (f) => {
    if (f.hidden && f.hidden(values)) return null;
    const v = values[f.name] ?? '';
    const common = { id: `f_${f.name}`, disabled: f.disabled && (typeof f.disabled === 'function' ? f.disabled(values) : true), className: `input ${errors[f.name] ? 'input-error' : ''}` };
    let control;
    switch (f.type) {
      case 'select':
        control = (
          <select {...common} className={`select ${errors[f.name] ? 'input-error' : ''}`} value={v} onChange={(e) => set(f.name, e.target.value)}>
            {!f.noBlank && <option value="">{f.placeholder || 'Select…'}</option>}
            {(typeof f.options === 'function' ? f.options(values) : f.options).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
        break;
      case 'textarea':
        control = <textarea {...common} className={`textarea ${errors[f.name] ? 'input-error' : ''}`} rows={f.rows || 3} value={v} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />;
        break;
      case 'checkbox':
        control = (
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-2">
            <input type="checkbox" className="w-4 h-4" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} /> {f.checkLabel || f.label}
          </label>
        );
        break;
      case 'multi':
        control = (
          <div className="flex flex-wrap gap-2">
            {f.options.map((o) => {
              const on = (values[f.name] || []).includes(o.value);
              return <button key={o.value} type="button" className={`chip ${on ? 'chip-active' : ''}`} onClick={() => set(f.name, on ? values[f.name].filter((x) => x !== o.value) : [...(values[f.name] || []), o.value])}>{o.label}</button>;
            })}
          </div>
        );
        break;
      default:
        control = <input {...common} type={f.type || 'text'} value={v} placeholder={f.placeholder} min={f.min} max={f.max} step={f.step} autoComplete="off" onChange={(e) => set(f.name, e.target.value)} />;
    }
    return (
      <Field key={f.name} label={f.type === 'checkbox' ? null : f.label} required={f.required} error={errors[f.name]} hint={f.hint} className={f.full || f.type === 'textarea' || f.type === 'multi' ? 'sm:col-span-2' : ''}>
        {control}
      </Field>
    );
  };

  return (
    <Modal
      open={open} onClose={busy ? undefined : onClose} title={title} subtitle={subtitle} size={size}
      footer={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="form-modal" className="btn btn-primary" disabled={busy}>{busy && <Spinner />}{submitText}</button>
        </>
      )}
    >
      <form id="form-modal" onSubmit={submit} noValidate>
        {formError && <div className="mb-4 rounded-xl border border-bad/30 bg-bad/10 text-bad text-sm px-4 py-2.5">{formError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">{fields.map(render)}</div>
        {children && <div className="mt-4">{typeof children === 'function' ? children(values) : children}</div>}
      </form>
    </Modal>
  );
}
