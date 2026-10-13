import { Popover } from '@base-ui/react/popover';
import { Info } from 'lucide-react';
import { useUiCopy } from '../lib/i18n';
import { Button } from './ui/Button';

/**
 * The posting-tips note (one per canvas toolbar). A popover keeps the tips
 * reachable without spending viewport height — ADR 0002.
 */
export function TipsPopover() {
  const { copy } = useUiCopy();

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button
            size="icon"
            variant="ghost"
            title={copy.tips_title}
            aria-label={copy.tips_title}
          >
            <Info className="w-4 h-4 text-blue-500" />
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={8}>
          <Popover.Popup className="max-w-xs p-4 rounded-2xl bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] shadow-xl text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            <Popover.Title className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              {copy.tips_title}
            </Popover.Title>
            <Popover.Description>{copy.posting_tips}</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
