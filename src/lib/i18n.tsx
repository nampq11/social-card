import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Interface Language: the language the UI Copy is displayed in.
 * Never affects Card Content (see GLOSSARY.md).
 */
// Single-file i18n module is the spec-bound layout (dictionaries + resolver +
// provider + hook), so fast refresh can't split it — remount-on-edit is fine.
// oxlint-disable react/only-export-components
export type Language = 'vi' | 'en';

/** localStorage key persisting the manually chosen Interface Language. */
export const UI_LANGUAGE_STORAGE_KEY = 'social-card.ui-language';

/**
 * UI Copy dictionary — everything the tool itself says (GLOSSARY.md).
 * Flat, single-level; `vi` is defined first so `en: typeof vi` makes the
 * compiler enforce identical key sets and value types per key.
 * Plain strings everywhere, except keys intentionally typed `ReactNode`
 * for inline emphasis (the sweep ticket adds those).
 */
const vi = {
  header_tagline: 'Tạo ảnh chuẩn mẫu cho X, Threads & Facebook',
  language_toggle_title: 'Đổi ngôn ngữ giao diện',
  copy_button: 'Copy ảnh (Ctrl+V)',
};

const en: typeof vi = {
  header_tagline: 'Pixel-perfect card images for X, Threads & Facebook',
  language_toggle_title: 'Switch interface language',
  copy_button: 'Copy image (Ctrl+V)',
};

export const dictionaries: Record<Language, typeof vi> = { vi, en };

/**
 * Initial Interface Language is ALWAYS Vietnamese (no browser detection);
 * only a persisted valid value wins. Pure so tests inject storage fakes
 * and the provider stays thin.
 */
export function resolveInitialLanguage(
  storage: { getItem(key: string): string | null }
): Language {
  const stored = storage.getItem(UI_LANGUAGE_STORAGE_KEY);
  return stored === 'vi' || stored === 'en' ? stored : 'vi';
}

type UiCopyContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  copy: typeof vi;
};

const UiCopyContext = createContext<UiCopyContextValue | null>(null);

export function UiCopyProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    resolveInitialLanguage(window.localStorage)
  );

  // Persist only manual choices; loading never writes to storage.
  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, next);
  }, []);

  // Keep the document language in sync for screen readers and translators.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, copy: dictionaries[language] }),
    [language, setLanguage]
  );

  return <UiCopyContext.Provider value={value}>{children}</UiCopyContext.Provider>;
}

/** Whole-dictionary lookup: `const { language, setLanguage, copy } = useUiCopy()`. */
export function useUiCopy(): UiCopyContextValue {
  const context = useContext(UiCopyContext);
  if (!context) {
    throw new Error('useUiCopy must be used within a UiCopyProvider');
  }
  return context;
}
