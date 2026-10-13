import React, { useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { useCardStore } from '../lib/card-store';
import { useUiCopy } from '../lib/i18n';
import { Button } from './ui/Button';
import { SegmentedControl } from './SegmentedControl';
import { INSPECTOR_TABS, type InspectorTabId } from './inspector-tabs';

// Desktop Shell host (GLOSSARY.md / ADR 0002): the Inspector groups its
// sections behind tabs from the shared INSPECTOR_TABS registry — the same
// grouping as the Mobile Sheet — so each tab fits a laptop-height panel
// without scrolling (the customize card never scrolls; the page never does).
// overflow-y-auto stays only as the graceful-degradation floor for windows
// shorter than any real laptop.
export const Inspector: React.FC = () => {
  const { copy } = useUiCopy();
  const resetCard = useCardStore((s) => s.resetCard);
  const [tab, setTab] = useState<InspectorTabId>('content');
  const active = INSPECTOR_TABS.find((t) => t.id === tab) ?? INSPECTOR_TABS[0];

  return (
    <aside className="w-96 shrink-0 flex flex-col gap-4 p-6 rounded-3xl glass-panel shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-y-auto min-h-0">
      {/* Header & Quick Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
            {copy.inspector_title}
          </h2>
        </div>
        <Button onClick={resetCard} variant="ghost" size="sm" title={copy.reset_title}>
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{copy.reset_button}</span>
        </Button>
      </div>

      <nav aria-label={copy.inspector_title} className="flex justify-center">
        <SegmentedControl<InspectorTabId>
          value={tab}
          onChange={setTab}
          options={INSPECTOR_TABS.map(({ id, nameKey, icon }) => ({
            value: id,
            label: copy[nameKey],
            icon,
          }))}
        />
      </nav>

      <div className="flex flex-col gap-5">
        {active.sections.map((Section) => (
          <Section key={Section.name} />
        ))}
      </div>
    </aside>
  );
};
