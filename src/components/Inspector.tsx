import React from 'react'
import { RotateCcw } from 'lucide-react'
import { useCardStore } from '../lib/card-store'
import { useUiCopy } from '../lib/i18n'
import { Button } from './ui/Button'
import { InspectorTabsNav, useInspectorTab } from './inspector-tabs'

// Desktop Shell host (GLOSSARY.md / ADR 0002): the Inspector groups its
// sections behind tabs from the shared INSPECTOR_TABS registry — the same
// grouping as the Mobile Sheet — so each tab fits a laptop-height panel
// without scrolling (the customize card never scrolls; the page never does).
// overflow-y-auto stays only as the graceful-degradation floor for windows
// shorter than any real laptop.
export const Inspector: React.FC = () => {
  const { copy } = useUiCopy()
  const resetCard = useCardStore((s) => s.resetCard)
  const { tab, setTab, active } = useInspectorTab()

  return (
    <aside
      data-tour="inspector"
      className="w-[345px] max-h-[calc(100vh-84px)] rounded-[22px] apple-glass p-4 flex flex-col justify-between shrink-0 shadow-lg"
    >
      <div className="overflow-y-auto pr-0.5 space-y-4">
        {/* Header & Quick Reset */}
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-[14px] font-semibold tracking-tight text-ink">
            {copy.inspector_title}
          </h2>
          <Button
            onClick={resetCard}
            variant="ghost"
            size="sm"
            title={copy.reset_title}
            className="text-[12px] font-medium text-ink-tertiary hover:text-ink dark:hover:text-white"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{copy.reset_button}</span>
          </Button>
        </div>

        {/* Segmented Control 100% full-width */}
        <InspectorTabsNav tab={tab} onChange={setTab} className="w-full" />

        <div className="flex flex-col gap-4">
          {active.sectionList.map((Section) => (
            <Section key={Section.name} />
          ))}
        </div>
      </div>

      {/* Footer replacing dead white space */}
      <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-ink-tertiary">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />
          <span>{copy.inspector_footer_layout}</span>
        </div>
        <span className="font-mono text-[10px] bg-black/[0.05] dark:bg-white/[0.08] px-1.5 py-0.5 rounded text-ink-faint">
          {copy.inspector_toggle_shortcut_hint}
        </span>
      </div>
    </aside>
  )
}
