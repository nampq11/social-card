import React, { useState } from 'react'
import { Type, Palette, UserRound } from 'lucide-react'
import { useUiCopy, type UiStringKey } from '../lib/i18n'
import { useCardStore } from '../lib/card-store'
import type { CardType } from '../types'
import { SegmentedControl } from './SegmentedControl'
import {
  CardTypeSwitcherSection,
  PresetsSection,
  ScreenshotsSection,
  AnnotationsSection,
  StyleSection,
  HeadlineSection,
  IdentitySection,
} from './inspector-sections'

// The one section grouping (GLOSSARY: Inspector): the Mobile Sheet's tabs
// and the desktop Inspector's tabs both render from this registry, so the
// two shells can never drift apart. Each group fits a laptop-height panel
// without scrolling — that fit is the design constraint that splits four
// sections into three tabs.
// Registry, shared tab state, and tab bar live in one module so a registry
// edit remounts its hosts (fast refresh can't split them) — fine here.
// oxlint-disable react/only-export-components
export type InspectorTabId = 'content' | 'style' | 'identity'

export interface InspectorTab {
  id: InspectorTabId
  nameKey: UiStringKey
  icon: React.ReactNode
  // Sections resolve per Card Type (spec #33): the hosts never branch on the
  // mode themselves — this registry is the single place the grouping changes.
  sections: (cardType: CardType) => React.FC[]
}

export const INSPECTOR_TABS: InspectorTab[] = [
  {
    id: 'content',
    nameKey: 'tab_content',
    icon: <Type />,
    // The type switcher leads the Content tab in BOTH modes (spec #33) —
    // Quote mode's only new control. Showcase swaps Presets + Headline
    // (dead in that mode) for the Screenshots section.
    sections: (cardType) =>
      cardType === 'showcase'
        ? [CardTypeSwitcherSection, ScreenshotsSection, AnnotationsSection]
        : [CardTypeSwitcherSection, PresetsSection, HeadlineSection],
  },
  { id: 'style', nameKey: 'tab_style', icon: <Palette />, sections: () => [StyleSection] },
  {
    id: 'identity',
    nameKey: 'tab_identity',
    icon: <UserRound />,
    sections: () => [IdentitySection],
  },
]

/** Tab state shared by both Shell hosts: which tab is open, and its registry entry. */
export function useInspectorTab() {
  const [tab, setTab] = useState<InspectorTabId>('content')
  const active = INSPECTOR_TABS.find((t) => t.id === tab) ?? INSPECTOR_TABS[0]
  const cardType = useCardStore((s) => s.card.cardType)
  // Sections resolve through the registry, so both Shells see the same
  // grouping for the current Card Type.
  return { tab, setTab, active: { ...active, sections: active.sections(cardType) } }
}

/** The tab bar every Shell host renders — one rendering of the registry, so
 * desktop and mobile can never show different tabs. */
export function InspectorTabsNav({
  tab,
  onChange,
  className = '',
}: {
  tab: InspectorTabId
  onChange: (tab: InspectorTabId) => void
  className?: string
}) {
  const { copy } = useUiCopy()
  return (
    <nav data-tour="inspector-tabs" aria-label={copy.inspector_title} className={className}>
      <SegmentedControl<InspectorTabId>
        value={tab}
        onChange={onChange}
        options={INSPECTOR_TABS.map(({ id, nameKey, icon }) => ({
          value: id,
          label: copy[nameKey],
          icon,
        }))}
      />
    </nav>
  )
}
