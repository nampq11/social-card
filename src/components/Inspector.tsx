import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { useCardStore } from '../lib/card-store';
import { useUiCopy } from '../lib/i18n';
import { Button } from './ui/Button';
import {
  PresetsSection,
  StyleSection,
  HeadlineSection,
  IdentitySection,
} from './inspector-sections';

// Desktop Shell host (GLOSSARY.md): the Inspector is the left sidebar and
// scrolls internally — the page itself never does. The Mobile Sheet hosts
// the same sections by tab; group them identically in both places.
export const Inspector: React.FC = () => {
  const { copy } = useUiCopy();
  const resetCard = useCardStore((s) => s.resetCard);

  return (
    <aside className="w-96 shrink-0 flex flex-col gap-6 p-6 rounded-3xl glass-panel shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-y-auto min-h-0">
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

      <PresetsSection />

      <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
        <StyleSection />
      </div>

      <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
        <HeadlineSection />
      </div>

      <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
        <IdentitySection />
      </div>
    </aside>
  );
};
