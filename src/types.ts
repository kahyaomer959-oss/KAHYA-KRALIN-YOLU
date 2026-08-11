export type MenuAction = 'none' | 'new_game' | 'load_game' | 'settings' | 'quit' | 'playing';

export type Difficulty = 'kolay' | 'normal' | 'zor' | 'kabus';

export type CharacterClass = 'kahya' | 'savasci' | 'buyucu' | 'golge';

export interface SaveSlot {
  id: number;
  characterName: string;
  characterClass: string;
  level: number;
  playtime: string;
  savedAt: string;
  chapter: string;
  healthPercent: number;
  difficulty: string;
  rulerTitle?: string;
  dynastyName?: string;
  kingdomOath?: string;
  countryName?: string;
  countryCode?: string;
  countryFlag?: string;
  turn?: number;
  gold?: number;
  incomePerTurn?: number;
  conqueredCountryCodes?: string[];
  conqueredCityIds?: string[];
  alliedCountryCodes?: string[];
  warCountryCodes?: string[];
  troopCounts?: Record<string, number>;
  cityTaxRates?: Record<string, number>;
  lostCityIds?: Record<string, string>;
  tributeBalance?: number;
  signedTreaties?: Record<string, {
    pact: boolean;
    trade: boolean;
    alliance: boolean;
    peace: boolean;
    reparations: boolean;
  }>;
  cityResources?: Record<string, {
    diamonds: number;
    goldOre: number;
    oil: number;
  }>;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  soundEnabled: boolean;
  graphicsQuality: 'Düşük' | 'Orta' | 'Yüksek' | 'Ultra';
  resolution: '1920x1080' | '2560x1440' | '3840x2160';
  fullscreen: boolean;
  vsync: boolean;
  ambientParticles: boolean;
  language: 'Türkçe' | 'English';
}
