import { useState } from 'react';
import { Type, Palette, UserRound, RotateCcw } from 'lucide-react';
import { SegmentedControl } from './SegmentedControl';
import { useCardStore } from '../lib/card-store';
import { useUiCopy } from '../lib/i18n';
import { Button } from './ui/Button';
import {
  PresetsSection,
  StyleSection,
  HeadlineSection,
  IdentitySection,
} from './inspector-sections';

// Mobile Shell host (GLOSSARY.md / ADR 0002): a standard, NON-MODAL bottom
// sheet behind a mode toolbar — the Canvas stays visible and live-updating.
// Peek shows the toolbar plus the top of the active tab; tapping the drag
// handle (a ≥48dp button) expands to the working height.
const SHEET_TABS = ['content', 'style', 'identity'] as const;
type SheetTab = (typeof SHEET_TABS)[number];

const PEEK_HEIGHT_CLASS = 'h-36';
const EXPANDED_HEIGHT_CLASS = 'h-[58dvh]';

export function MobileSheet() {
  const { copy } = useUiCopy();
  const resetCard = useCardStore((s) => s.resetCard);
  const [tab, setTab] = useState<SheetTab>('content');
  const [expanded, setExpanded] = useState(false);

  const tabTitle: Record<SheetTab, string> = {
    content: copy.tab_content,
    style: copy.tab_style,
    identity: copy.tab_identity,
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col">
      <nav aria-label={copy.inspector_title} className="flex justify-center px-3 pb-1.5">
        <SegmentedControl<SheetTab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'content', label: copy.tab_content, icon: <Type /> },
            { value: 'style', label: copy.tab_style, icon: <Palette /> },
            { value: 'identity', label: copy.tab_identity, icon: <UserRound /> },
          ]}
        />
      </nav>

      <section
        aria-label={tabTitle[tab]}
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
            {tabTitle[tab]}
          </span>
          <Button onClick={resetCard} variant="ghost" size="sm" title={copy.reset_title}>
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{copy.reset_button}</span>
          </Button>
        </div>

        {/* inert while peeked: clipped controls must not stay keyboard-reachable */}
        <div className="flex-1 overflow-y-auto px-5 pb-6" inert={!expanded}>
          {tab === 'content' && (
            <div className="flex flex-col gap-5">
              <PresetsSection />
              <HeadlineSection />
            </div>
          )}
          {tab === 'style' && <StyleSection />}
          {tab === 'identity' && <IdentitySection />}
        </div>
      </section>
    </div>
  );
}
