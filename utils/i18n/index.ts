import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh.json'

export type SupportedLocale = 'en' | 'zh'
export type LocaleSetting = 'auto' | SupportedLocale

export function detectLocale(): SupportedLocale {
  const lang = navigator.language || navigator.languages?.[0] || 'en'
  return lang.startsWith('zh') ? 'zh' : 'en'
}

export function resolveLocale(setting: LocaleSetting): SupportedLocale {
  return setting === 'auto' ? detectLocale() : setting
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, zh },
})

/**
 * Standalone translate function for non-Vue contexts (content script logic, utility files).
 * Reads from the same i18n instance so language stays in sync.
 */
export function t(key: string, params?: Record<string, unknown>): string {
  return i18n.global.t(key, params ?? {})
}

export function setLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale
}
