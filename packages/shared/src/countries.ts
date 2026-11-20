/**
 * The 32 nations/blocs in the player pool: the G20 (19 countries + the EU)
 * plus 12 other newsworthy nations. Keyed by ISO 3166-1 alpha-2 code
 * ("EU" for the European Union). `wikiLang` is the main home-language
 * Wikipedia, used as an optional second pageview source.
 */
export interface CountryInfo {
  name: string;
  flag: string;
  wikiLang: string;
  g20: boolean;
}

export const COUNTRIES: Record<string, CountryInfo> = {
  US: { name: 'United States', flag: '🇺🇸', wikiLang: 'en', g20: true },
  CN: { name: 'China', flag: '🇨🇳', wikiLang: 'zh', g20: true },
  JP: { name: 'Japan', flag: '🇯🇵', wikiLang: 'ja', g20: true },
  DE: { name: 'Germany', flag: '🇩🇪', wikiLang: 'de', g20: true },
  IN: { name: 'India', flag: '🇮🇳', wikiLang: 'hi', g20: true },
  GB: { name: 'United Kingdom', flag: '🇬🇧', wikiLang: 'en', g20: true },
  FR: { name: 'France', flag: '🇫🇷', wikiLang: 'fr', g20: true },
  IT: { name: 'Italy', flag: '🇮🇹', wikiLang: 'it', g20: true },
  CA: { name: 'Canada', flag: '🇨🇦', wikiLang: 'fr', g20: true },
  BR: { name: 'Brazil', flag: '🇧🇷', wikiLang: 'pt', g20: true },
  RU: { name: 'Russia', flag: '🇷🇺', wikiLang: 'ru', g20: true },
  KR: { name: 'South Korea', flag: '🇰🇷', wikiLang: 'ko', g20: true },
  AU: { name: 'Australia', flag: '🇦🇺', wikiLang: 'en', g20: true },
  MX: { name: 'Mexico', flag: '🇲🇽', wikiLang: 'es', g20: true },
  ID: { name: 'Indonesia', flag: '🇮🇩', wikiLang: 'id', g20: true },
  TR: { name: 'Turkey', flag: '🇹🇷', wikiLang: 'tr', g20: true },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦', wikiLang: 'ar', g20: true },
  AR: { name: 'Argentina', flag: '🇦🇷', wikiLang: 'es', g20: true },
  ZA: { name: 'South Africa', flag: '🇿🇦', wikiLang: 'en', g20: true },
  EU: { name: 'European Union', flag: '🇪🇺', wikiLang: 'en', g20: true },
  UA: { name: 'Ukraine', flag: '🇺🇦', wikiLang: 'uk', g20: false },
  IL: { name: 'Israel', flag: '🇮🇱', wikiLang: 'he', g20: false },
  IR: { name: 'Iran', flag: '🇮🇷', wikiLang: 'fa', g20: false },
  PL: { name: 'Poland', flag: '🇵🇱', wikiLang: 'pl', g20: false },
  ES: { name: 'Spain', flag: '🇪🇸', wikiLang: 'es', g20: false },
  NL: { name: 'Netherlands', flag: '🇳🇱', wikiLang: 'nl', g20: false },
  NG: { name: 'Nigeria', flag: '🇳🇬', wikiLang: 'en', g20: false },
  EG: { name: 'Egypt', flag: '🇪🇬', wikiLang: 'ar', g20: false },
  PK: { name: 'Pakistan', flag: '🇵🇰', wikiLang: 'ur', g20: false },
  PH: { name: 'Philippines', flag: '🇵🇭', wikiLang: 'tl', g20: false },
  VN: { name: 'Vietnam', flag: '🇻🇳', wikiLang: 'vi', g20: false },
  TW: { name: 'Taiwan', flag: '🇹🇼', wikiLang: 'zh', g20: false },
};

export function countryName(code: string): string {
  return COUNTRIES[code]?.name ?? code;
}

export function countryFlag(code: string): string {
  return COUNTRIES[code]?.flag ?? '🏳️';
}
