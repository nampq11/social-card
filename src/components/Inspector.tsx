import React, { useState } from 'react'
import { Sparkles, RotateCcw } from 'lucide-react'
import { useCardStore } from '../lib/card-store'
import { useUiCopy } from '../lib/i18n'
import { Button } from './ui/Button'
import { SegmentedControl } from './SegmentedControl'
import { INSPECTOR_TABS, type InspectorTabId } from './inspector-tabs'

// Desktop Shell host (GLOSSARY.md / ADR 0002): the Inspector groups its
// sections behind tabs from the shared INSPECTOR_TABS registry — the same
// grouping as the Mobile Sheet — so each tab fits a laptop-height panel
// without scrolling (the customize card never scrolls; the page never does).
// overflow-y-auto stays only as the graceful-degradation floor for windows
// shorter than any real laptop.
export const Inspector: React.FC = () => {
  const { copy } = useUiCopy()
  const resetCard = useCardStore((s) => s.resetCard)
  const [tab, setTab] = useState<InspectorTabId>('content')
  const active = INSPECTOR_TABS.find((t) => t.id === tab) ?? INSPECTOR_TABS[0]

  return (
    <aside
      data-tour="inspector"
      className="w-[345px] max-h-[calc(100vh-84px)] rounded-[22px] apple-glass p-4 flex flex-col justify-between shrink-0 shadow-lg"
    >
      <div className="overflow-y-auto pr-0.5 space-y-4">
        {/* Header & Quick Reset */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-[14px] font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              {copy.inspector_title}
            </h2>
          </div>
          <Button
            onClick={resetCard}
            variant="ghost"
            size="sm"
            title={copy.reset_title}
            className="text-[12px] font-medium text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{copy.reset_button}</span>
          </Button>
        </div>

        {/* Segmented Control 100% full-width */}
        <nav data-tour="inspector-tabs" aria-label={copy.inspector_title} className="w-full">
          <SegmentedControl<InspectorTabId>
            value={tab}
            onChange={setTab}
            className="w-full"
            options={INSPECTOR_TABS.map(({ id, nameKey, icon }) => ({
              value: id,
              label: copy[nameKey],
              icon,
            }))}
          />
        </nav>

        <div className="flex flex-col gap-4">
          {active.sections.map((Section) => (
            <Section key={Section.name} />
          ))}
        </div>
      </div>

      {/* Footer replacing dead white space */}
      <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-[#86868B] dark:text-[#A1A1A6]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />
          <span>Apple HIG Layout</span>
        </div>
        <span className="font-mono text-[10px] bg-black/[0.05] dark:bg-white/[0.08] px-1.5 py-0.5 rounded text-[#515154] dark:text-[#A1A1A6]">
          ⌘\ Toggle Panel
        </span>
      </div>
    </aside>
  )
}
