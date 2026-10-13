import { useState } from 'react';
import { RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { SegmentedControl } from './SegmentedControl';
import { useCardStore } from '../lib/card-store';
import { useUiCopy } from '../lib/i18n';
import { Button } from './ui/Button';
import { INSPECTOR_TABS, type InspectorTabId } from './inspector-tabs';

// Mobile Shell host (GLOSSARY.md / ADR 0002): a standard, NON-MODAL bottom
// sheet behind a mode toolbar — the Canvas stays visible and live-updating.
// Peek shows the toolbar plus the top of the active tab; tapping the drag
// handle (a ≥48dp button) expands to the working height.
const PEEK_HEIGHT_CLASS = 'h-36';
const EXPANDED_HEIGHT_CLASS = 'h-[58dvh]';

export function MobileSheet() {
  const { copy } = useUiCopy();
  const resetCard = useCardStore((s) => s.resetCard);
  // Edit history joins Reset here on mobile — the Header keeps its copy only
  // from lg up, so touch users get their undo affordance in the sheet header.
  const canUndo = useCardStore((s) => s.canUndo);
  const canRedo = useCardStore((s) => s.canRedo);
  const undo = useCardStore((s) => s.undo);
  const redo = useCardStore((s) => s.redo);
  const [tab, setTab] = useState<InspectorTabId>('content');
  const [expanded, setExpanded] = useState(false);

  const active = INSPECTOR_TABS.find((t) => t.id === tab) ?? INSPECTOR_TABS[0];
  const tabTitle = copy[active.nameKey];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col">
      <nav aria-label={copy.inspector_title} className="flex justify-center px-3 pb-1.5">
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

      <section
        aria-label={tabTitle}
        className={`glass-panel rounded-t-3xl border-b-0 overflow-hidden flex flex-col transition-[height] duration-300 ease-out motion-reduce:transition-none ${
          expanded ? EXPANDED_HEIGHT_CLASS : PEEK_HEIGHT_CLASS
        }`}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={copy.sheet_toggle_title}
          className="h-12 shrink-0 flex items-center justify-center cursor-pointer"
        >
          <span className="w-10 h-1.5 rounded-full bg-neutral-400/70 dark:bg-neutral-500/70" />
        </button>

        <div className="flex items-center justify-between px-5 pb-2 shrink-0">
          <span className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
            {tabTitle}
          </span>
          <Button
            onClick={undo}
            disabled={!canUndo}
            variant="ghost"
            size="sm"
            title={copy.undo_button_title}
            aria-label={copy.undo_button_title}
          >
            <Undo2 />
          </Button>
          <Button
            onClick={redo}
            disabled={!canRedo}
            variant="ghost"
            size="sm"
            title={copy.redo_button_title}
            aria-label={copy.redo_button_title}
          >
            <Redo2 />
          </Button>
          <Button onClick={resetCard} variant="ghost" size="sm" title={copy.reset_title}>
            <RotateCcw />
            <span>{copy.reset_button}</span>
          </Button>
        </div>

        {/* inert while peeked: clipped controls must not stay keyboard-reachable */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          inert={!expanded}
        >
          <div className="flex flex-col gap-5">
            {active.sections.map((Section) => (
              <Section key={Section.name} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
