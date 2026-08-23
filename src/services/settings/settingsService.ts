import type { ThemePreference } from '../../types';import { localAdapter } from '../../adapters/local/store'
export const settingsService={getTheme:()=>localAdapter.read().settings.theme,setTheme(theme:ThemePreference){const s=localAdapter.read();s.settings.theme=theme;localAdapter.write(s)}}
