import React from 'react';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  'aria-labelledby'?: string;
}

// Radio-group segmented control built on base-ui's toggle-group primitives:
// roving focus and arrow-key navigation come from the library; the radio
// semantics (radiogroup / radio / aria-checked, checked item as tab stop,
// selection that follows focus) are layered here because base-ui's toggle
// group alone exposes plain toggle-button ARIA (`aria-pressed`).
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  'aria-labelledby': labelledBy,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup<T>
      value={[value]}
      onValueChange={(groupValue) => {
        // Radio invariant: activating the checked option must not clear it.
        const next = groupValue[0];
        if (next !== undefined && next !== value) onChange(next);
      }}
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={`inline-flex p-1 bg-black/[0.05] dark:bg-white/[0.08] rounded-xl border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md ${className}`}
    >
      {options.map((opt) => {
        const checked = opt.value === value;
        return (
          <Toggle
            key={opt.value}
            value={opt.value}
            role="radio"
            aria-checked={checked}
            // One tab stop per group, glued to the checked option: Tab enters
            // the group on the active choice (and stays on it after external
            // Card State changes), so Tab jumps between control groups.
            tabIndex={checked ? 0 : -1}
            onFocus={() => {
              // Radio pattern: selection follows focus, so arrow-key roving
              // focus moves the selection too.
              if (!checked) onChange(opt.value);
            }}
            className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-[background-color,color,box-shadow] duration-150 ease-out apple-button select-none cursor-pointer ${
              checked
                ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {opt.icon && <span className="w-3.5 h-3.5">{opt.icon}</span>}
            <span>{opt.label}</span>
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}
