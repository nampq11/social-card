import React from 'react';

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
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex p-1 bg-black/[0.05] dark:bg-white/[0.08] rounded-xl border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md ${className}`}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-[background-color,color,box-shadow] duration-150 ease-out apple-button select-none cursor-pointer ${
              isActive
                ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {opt.icon && <span className="w-3.5 h-3.5">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
