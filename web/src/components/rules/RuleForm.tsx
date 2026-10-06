import React, { useState } from 'react';
import { mockPatternDetails } from '../../data/operationsMock';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import type { NewFraudRule, RuleAction } from '../../types/operations';

interface RuleFormProps {
  onSubmit: (rule: NewFraudRule) => void;
  onCancel: () => void;
  submitting: boolean;
  defaultPattern?: string;
}

const inputClass =
'inset-well mt-1.5 w-full rounded-xl border border-line px-3 text-[13px] text-ink placeholder:text-ink-soft focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100';

export function RuleForm({ onSubmit, onCancel, submitting, defaultPattern }: RuleFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pattern, setPattern] = useState(defaultPattern ?? mockPatternDetails[0].id);
  const [threshold, setThreshold] = useState(70);
  const [action, setAction] = useState<RuleAction>('Review');
  const [touched, setTouched] = useState(false);
  const nameError = touched && name.trim().length < 3 ? 'Give the rule a name (3+ characters).' : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (name.trim().length < 3) return;
        onSubmit({ name: name.trim(), description: description.trim(), pattern, threshold, action });
      }}
      className="space-y-4"
      noValidate>
      
      <label className="block text-xs font-medium text-ink">
        Rule name
        <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. High-value first purchase" className={cn(inputClass, 'h-10', nameError && 'border-rose-300')} aria-invalid={!!nameError} />
        {nameError && <span className="mt-1 block text-[11px] font-normal text-rose-600">{nameError}</span>}
      </label>
      <label className="block text-xs font-medium text-ink">
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What does this rule catch?" className={cn(inputClass, 'py-2')} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-ink">
          Pattern
          <select value={pattern} onChange={(e) => setPattern(e.target.value)} className={cn(inputClass, 'h-10')}>
            {mockPatternDetails.map((p) =>
            <option key={p.id} value={p.id}>
                {p.name}
              </option>
            )}
          </select>
        </label>
        <fieldset>
          <legend className="text-xs font-medium text-ink">Action</legend>
          <div className="inset-well mt-1.5 flex h-10 rounded-xl border border-line p-1">
            {(['Review', 'Decline'] as const).map((a) =>
            <button key={a} type="button" aria-pressed={action === a} onClick={() => setAction(a)} className={cn('flex-1 rounded-lg text-xs font-medium transition-colors duration-150', action === a ? a === 'Decline' ? 'bg-rose-500 text-white' : 'brand-chip text-white' : 'text-ink-muted')}>
                {a}
              </button>
            )}
          </div>
        </fieldset>
      </div>
      <label className="block text-xs font-medium text-ink">
        <span className="flex justify-between">
          Fires at risk score <span className="tabular font-semibold">{threshold}</span>
        </span>
        <input type="range" min={10} max={99} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="mt-2 w-full accent-brand-500" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Create rule
        </Button>
      </div>
    </form>);

}