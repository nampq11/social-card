import type React from 'react'
import { Type, Palette, UserRound } from 'lucide-react'
import type { UiStringKey } from '../lib/i18n'
import {
  PresetsSection,
  StyleSection,
  HeadlineSection,
  IdentitySection,
} from './inspector-sections'

// The one section grouping (GLOSSARY: Inspector): the Mobile Sheet's tabs
// and the desktop Inspector's tabs both render from this registry, so the
// two shells can never drift apart. Each group fits a laptop-height panel
// without scrolling — that fit is the design constraint that splits four
// sections into three tabs.
export type InspectorTabId = 'content' | 'style' | 'identity'

export interface InspectorTab {
  id: InspectorTabId
  nameKey: UiStringKey
  icon: React.ReactNode
  sections: React.FC[]
}

export const INSPECTOR_TABS: InspectorTab[] = [
  {
    id: 'content',
    nameKey: 'tab_content',
    icon: <Type />,
    sections: [PresetsSection, HeadlineSection],
  },
  { id: 'style', nameKey: 'tab_style', icon: <Palette />, sections: [StyleSection] },
  { id: 'identity', nameKey: 'tab_identity', icon: <UserRound />, sections: [IdentitySection] },
]
