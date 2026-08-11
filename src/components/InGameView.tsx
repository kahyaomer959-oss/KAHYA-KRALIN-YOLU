import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Swords,
  Scroll,
  Sparkles,
  Flag,
  Globe,
  Coins,
  Users,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  Sliders,
  Handshake,
  Skull,
  Award,
  FastForward,
  X,
  CheckCircle,
  AlertTriangle,
  Send,
  Save,
  Clock,
  Pickaxe,
  Crown,
  Search,
  Star,
  Gem,
  MapPin,
  Activity,
  Wallet,
  Percent,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SaveSlot, GameSettings } from '../types';
import { Country, WORLD_COUNTRIES, getCountryStats } from '../data/countries';
import { getCountryCities, City, COUNTRY_CITIES } from '../data/cities';
const ALL_CITIES = Object.values(COUNTRY_CITIES).flat();
import { AgeOfHistoryMap, MapMode } from './AgeOfHistoryMap';
import { soundFx } from '../utils/sound';
import { parsePopulationNumber, calculateCityMonthlyTax, calculateCityDailyTax } from '../utils/tax';
import { t, translateMonth, translateContinent, Language, formatLog, LogEntry } from '../utils/i18n';

const getEconomyMultiplier = (countryCode: string) => {
  const c = WORLD_COUNTRIES.find(c => c.code.toLowerCase() === countryCode.toLowerCase());
  if (!c) return 1;
  const stats = getCountryStats(c);
  if (!stats.defenseBudget) return 1;
  const match = stats.defenseBudget.match(/[\d,.]+/);
  if (!match) return 1;
  const num = parseFloat(match[0].replace(/,/g, ''));
  const isMillion = stats.defenseBudget.toLowerCase().includes('milyon');
  const economyValue = isMillion ? num / 1000 : num;
  let mult = Math.max(0.1, Math.sqrt(economyValue) / 4);
  // Büyük ülkelerin satış/ekonomi çarpanı yarıya düşürülüyor
  if (mult > 1) {
    mult = mult / 2;
  }
  return mult;
};

export interface TroopUnitType {
  id: 'infantry' | 'cavalry' | 'ranged' | 'armored';
  nameKey: string;
  icon: string;
  cost: number;
  powerMult: number;
  trainTimePer1k: number; // seconds per 1000 units
  badgeKey: string;
  descKey: string;
  color: string;
  borderColor: string;
  bgActive: string;
}

export const TROOP_UNITS: TroopUnitType[] = [
  {
    id: 'infantry',
    nameKey: 'infantryName',
    icon: '🗡️',
    cost: 10,
    powerMult: 1.0,
    trainTimePer1k: 3, // 3s per 1k
    badgeKey: 'infantryBadge',
    descKey: 'infantryDesc',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/60',
    bgActive: 'bg-emerald-950/70 border-emerald-500 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  },
  {
    id: 'cavalry',
    nameKey: 'cavalryName',
    icon: '🐎',
    cost: 25,
    powerMult: 2.2,
    trainTimePer1k: 5, // 5s per 1k
    badgeKey: 'cavalryBadge',
    descKey: 'cavalryDesc',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/60',
    bgActive: 'bg-amber-950/70 border-amber-500 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
  },
  {
    id: 'ranged',
    nameKey: 'rangedName',
    icon: '🏹',
    cost: 45,
    powerMult: 3.5,
    trainTimePer1k: 8, // 8s per 1k
    badgeKey: 'rangedBadge',
    descKey: 'rangedDesc',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/60',
    bgActive: 'bg-cyan-950/70 border-cyan-500 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
  },
  {
    id: 'armored',
    nameKey: 'armoredName',
    icon: '🛡️',
    cost: 100,
    powerMult: 8.0,
    trainTimePer1k: 12, // 12s per 1k
    badgeKey: 'armoredBadge',
    descKey: 'armoredDesc',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/60',
    bgActive: 'bg-purple-950/70 border-purple-500 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
  },
];

export function getUnitName(id: string, lang?: Language): string {
  return t(id + 'Name', lang);
}

export function getUnitBadge(id: string, lang?: Language): string {
  return t(id + 'Badge', lang);
}

export function getUnitDesc(id: string, lang?: Language): string {
  return t(id + 'Desc', lang);
}

const getPactCost = (countryCode: string) => {
  const multiplier = getEconomyMultiplier(countryCode);
  const normalized = Math.min(1, Math.max(0, (multiplier - 0.1) / 7.4));
  return Math.floor(50000 + (normalized * 100000));
};

interface InGameViewProps {
  heroName: string;
  heroClass: string;
  difficulty: string;
  country?: Country | null;
  initialSaveData?: SaveSlot | null;
  settings?: GameSettings;
  onReturnToMenu: () => void;
}

export const InGameView: React.FC<InGameViewProps> = ({
  heroName,
  heroClass,
  difficulty,
  country,
  initialSaveData,
  settings,
  onReturnToMenu,
}) => {
  const lang: Language = settings?.language || 'Türkçe';
  // Player Country (Default Turkey if not passed)
  const playerCountry = country || WORLD_COUNTRIES.find((c) => c.code === (initialSaveData?.countryCode || 'tr')) || WORLD_COUNTRIES[0];
  const playerCode = playerCountry.code.toLowerCase();

  // Strategy Game State
  const [turn, setTurn] = useState(initialSaveData?.turn ?? 1);
  const [dateYear, setDateYear] = useState(2026 + Math.floor(((initialSaveData?.turn ?? 1) - 1) / 12));
  const [dateMonth, setDateMonth] = useState('Ocak');
  const [dateDay, setDateDay] = useState(1);
  const [dayTimerSeconds, setDayTimerSeconds] = useState(300); // 5 minutes = 300 seconds

  // Per-city Tax Rates mapping (cityId -> taxRate %)
  const [cityTaxRates, setCityTaxRates] = useState<Record<string, number>>(() => initialSaveData?.cityTaxRates ?? {});

  // Per-city underground resources (diamonds, goldOre, oil)
  const [cityResources, setCityResources] = useState<Record<string, { diamonds: number; goldOre: number; oil: number }>>(() => initialSaveData?.cityResources ?? {});

  // Exit & Save Confirmation Modal State
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(soundFx.soundEnabled);

  const toggleSound = () => {
    const nextState = !soundFx.soundEnabled;
    soundFx.soundEnabled = nextState;
    soundFx.updateVolumes(nextState, soundFx.masterVolume, soundFx.sfxVolume, soundFx.musicVolume);
    setIsSoundEnabled(nextState);
    if (nextState) {
      soundFx.playClick();
    }
  };

  // Economy & Resources
  const getInitialGoldForDiff = (diff?: string) => {
    const d = (diff || difficulty || 'normal').toLowerCase();
    if (d === 'kolay' || d === 'easy') return 200000;
    if (d === 'zor' || d === 'hard') return 100000;
    if (d === 'kabus' || d === 'nightmare') return 50000;
    return 150000; // normal
  };

  const [gold, setGold] = useState(initialSaveData?.gold ?? getInitialGoldForDiff(initialSaveData?.difficulty));
  const [incomePerTurn, setIncomePerTurn] = useState(initialSaveData?.incomePerTurn ?? 4800);
  const [dipPoints, setDipPoints] = useState(10.0);
  const [movePoints, setMovePoints] = useState(10.0);

  // Budget Sliders
  const [taxRate, setTaxRate] = useState(30); // %
  const [militaryBudget, setMilitaryBudget] = useState(40); // %
  const [researchBudget, setResearchBudget] = useState(30); // %
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Map & Conquest State
  const [mapMode, setMapMode] = useState<MapMode>('political');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(playerCode);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [conqueredCountryCodes, setConqueredCountryCodes] = useState<string[]>(initialSaveData?.conqueredCountryCodes ?? []);
  const [conqueredCityIds, setConqueredCityIds] = useState<string[]>(initialSaveData?.conqueredCityIds ?? []);
  const [tributeBalance, setTributeBalance] = useState(initialSaveData?.tributeBalance ?? 0);
  const [lostCityIds, setLostCityIds] = useState<Record<string, string>>(initialSaveData?.lostCityIds ?? {});
  const [alliedCountryCodes, setAlliedCountryCodes] = useState<string[]>(initialSaveData?.alliedCountryCodes ?? ['az']); // Azerbaijan default ally
  const [warCountryCodes, setWarCountryCodes] = useState<string[]>(initialSaveData?.warCountryCodes ?? []);
  const [countryRelations, setCountryRelations] = useState<Record<string, number>>({
    az: 100,
    tr: 100,
    de: 30,
    us: 20,
    ru: 10,
    gr: -20,
  });

  const [showTradeModal, setShowTradeModal] = useState<string | null>(null); // holds the target country code
  const [tradeResourceType, setTradeResourceType] = useState<'diamonds' | 'goldOre' | 'oil'>('diamonds');
  const [tradeAmount, setTradeAmount] = useState<number>(0);

  // Dynamic Troop Counts
  const [troopCounts, setTroopCounts] = useState<Record<string, number>>(() => {
    const saved = initialSaveData?.troopCounts || {};
    const initial: Record<string, number> = {};

    WORLD_COUNTRIES.forEach((c) => {
      const code = c.code.toLowerCase();
      const cities = getCountryCities(code);
      const capital = cities.find(city => city.isCapital) || cities[0];

      if (code === playerCode) {
        // Player's starting country: 100,000 troops gathered strictly in its capital only!
        if (cities.length > 0) {
          cities.forEach((city) => {
            if (saved[city.id] !== undefined) {
              initial[city.id] = saved[city.id];
            } else if (city.isCapital || city.id === capital?.id) {
              initial[city.id] = 100000;
            } else {
              initial[city.id] = 0;
            }
          });
        } else {
          initial[code] = saved[code] !== undefined ? saved[code] : 100000;
        }
      } else {
        // AI Countries: Capital Defense x 6 multiplier, non-capitals x 7. Powerful countries (US, RU, CN, DE, GB, FR, JP) get x2 multiplier!
        const stats = getCountryStats(c);
        const activeStr = stats.activeMilitary.replace(/[^0-9]/g, '');
        const baseMilitary = parseInt(activeStr, 10) || 50000;
        
        const capitalDefense = capital ? capital.defense : baseMilitary;
        const powerfulCountries = ['us', 'ru', 'cn', 'de', 'gb', 'fr', 'jp'];
        const isPowerful = powerfulCountries.includes(code);
        const powerMultiplier = isPowerful ? 2 : 1;

        const totalTroops = capitalDefense * 6 * powerMultiplier;
        const totalWeight = cities.reduce((sum, city) => sum + (city.defense || 5000), 0);

        if (cities.length > 0) {
          cities.forEach((city) => {
            if (saved[city.id] !== undefined) {
              initial[city.id] = saved[city.id];
            } else {
              const cityWeight = city.defense || 5000;
              let cityTroops = Math.max(1000, Math.round((cityWeight / (totalWeight || 1)) * totalTroops));
              if (!city.isCapital) {
                cityTroops = cityTroops * 7;
              }
              initial[city.id] = cityTroops;
            }
          });
        } else {
          initial[code] = saved[code] !== undefined ? saved[code] : totalTroops;
        }
      }
    });
    return initial;
  });

  // Infallible Helper to get a city's current military strength
  const getCityTroops = (cityId: string, countryCode: string): number => {
    if (troopCounts[cityId] !== undefined) {
      return troopCounts[cityId];
    }
    const lowerCode = countryCode.toLowerCase();
    const cities = getCountryCities(lowerCode);
    const city = cities.find(c => c.id === cityId);
    const capital = cities.find(c => c.isCapital) || cities[0];

    if (lowerCode === playerCode) {
      if (city && (city.isCapital || city.id === capital?.id)) {
        return 100000;
      }
      return 0;
    }

    const countryObj = WORLD_COUNTRIES.find(c => c.code.toLowerCase() === lowerCode);
    const stats = countryObj ? getCountryStats(countryObj) : null;
    const activeStr = stats ? stats.activeMilitary.replace(/[^0-9]/g, '') : '50000';
    const baseMilitary = parseInt(activeStr, 10) || 50000;

    const capitalDefense = capital ? capital.defense : baseMilitary;
    const powerfulCountries = ['us', 'ru', 'cn', 'de', 'gb', 'fr', 'jp'];
    const isPowerful = powerfulCountries.includes(lowerCode);
    const powerMultiplier = isPowerful ? 2 : 1;

    const totalTroops = capitalDefense * 6 * powerMultiplier;
    const totalWeight = cities.reduce((sum, c) => sum + (c.defense || 5000), 0);
    const cityWeight = city ? (city.defense || 5000) : 5000;

    let baseCalculated = Math.max(1000, Math.round((cityWeight / (totalWeight || 1)) * totalTroops));
    if (city && !city.isCapital) {
      baseCalculated = baseCalculated * 7;
    }
    return baseCalculated;
  };

  // Recruitment Slider State
  const [selectedUnitType, setSelectedUnitType] = useState<'infantry' | 'cavalry' | 'ranged' | 'armored'>('infantry');
  const [recruitSliderAmount, setRecruitSliderAmount] = useState(1000);
  const [isAttackMode, setIsAttackMode] = useState(false);

  // Troop Transfer / March Mode State
  const [transferSourceCityId, setTransferSourceCityId] = useState<string | null>(null);
  const [transferTargetCityId, setTransferTargetCityId] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState(20000);

  // Battle Simulation Modal State
  const [battleState, setBattleState] = useState<{
    isOpen: boolean;
    targetCountry: Country | null;
    playerTroops: number;
    targetTroops: number;
    winner: 'player' | 'target' | null;
    playerLosses: number;
    targetLosses: number;
  } | null>(null);

  // Active Siege & Battle Report State
  const [pendingSiegeCity, setPendingSiegeCity] = useState<{
    city: City;
    targetCountry: Country;
    targetCode: string;
    enemyTroops: number;
    playerTroops: number;
  } | null>(null);

  // Player Fullscreen Empire Menu State
  const [isPlayerMenuOpen, setIsPlayerMenuOpen] = useState(false);
  const [playerMenuTab, setPlayerMenuTab] = useState<'manager' | 'conquered' | 'enemies' | 'treaties'>('manager');
  const [menuSelectedCityId, setMenuSelectedCityId] = useState<string | null>(null);
  const [playerMenuSearch, setPlayerMenuSearch] = useState('');
  const [conqueredSearchQuery, setConqueredSearchQuery] = useState('');
  const [enemySearchQuery, setEnemySearchQuery] = useState('');

  // Peace Offer Modal State
  const [peaceOfferCountry, setPeaceOfferCountry] = useState<Country | null>(null);
  const [peaceOfferGold, setPeaceOfferGold] = useState<number>(50000);
  const [peaceOfferResult, setPeaceOfferResult] = useState<{ success: boolean; message: string } | null>(null);

  const [activeSieges, setActiveSieges] = useState<Array<{
    id: string;
    city: City;
    targetCountry: Country;
    targetCode: string;
    duration: number;
    timeLeft: number;
    playerTroopsBefore: number;
    enemyTroopsBefore: number;
  }>>([]);

  const [battleReport, setBattleReport] = useState<{
    isOpen: boolean;
    city: City;
    targetCountry: Country;
    winner: 'player' | 'target';
    playerTroopsBefore: number;
    playerLosses: number;
    playerRemaining: number;
    enemyTroopsBefore: number;
    enemyLosses: number;
    duration: number;
  } | null>(null);

  // Training Queue State
  const [trainingQueues, setTrainingQueues] = useState<Array<{
    id: string;
    unitId: 'infantry' | 'cavalry' | 'ranged' | 'armored';
    unitName: string;
    unitIcon: string;
    targetKey: string;
    placeName: string;
    amount: number;
    powerAdded: number;
    duration: number;
    timeLeft: number;
  }>>([]);

  // Training Queue Countdown Timer Effect
  useEffect(() => {
    if (trainingQueues.length === 0) return;
    const timer = setInterval(() => {
      setTrainingQueues((prev) => {
        if (prev.length === 0) return [];
        const next = prev.map(item => ({
          ...item,
          timeLeft: item.timeLeft - 1
        }));

        const finished = next.filter(i => i.timeLeft <= 0);
        const remaining = next.filter(i => i.timeLeft > 0);

        finished.forEach(completed => {
          soundFx.playSuccess();
          setTroopCounts((tc) => ({
            ...tc,
            [completed.targetKey]: (tc[completed.targetKey] || 0) + completed.powerAdded,
          }));
          addLog(
            `✅ ${t('trainingComplete', lang)}: ${completed.placeName} bölgesinde +${completed.amount.toLocaleString()} ${completed.unitIcon} ${completed.unitName} (+${completed.powerAdded.toLocaleString()} Ordu Gücü) kışladan sahaya indirildi!`,
            `✅ ${t('trainingComplete', lang)}: +${completed.amount.toLocaleString()} ${completed.unitIcon} ${getUnitName(completed.unitId, lang)} (+${completed.powerAdded.toLocaleString()} Army Power) deployed in ${completed.placeName}!`
          );
        });

        return remaining;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [trainingQueues]);

  // Active Sieges Countdown Timer Effect
  useEffect(() => {
    if (activeSieges.length === 0) return;
    const timer = setInterval(() => {
      setActiveSieges((prev) => {
        if (prev.length === 0) return [];
        const next = prev.map(siege => ({
          ...siege,
          timeLeft: siege.timeLeft - 1
        }));

        const finished = next.filter(s => s.timeLeft <= 0);
        const remaining = next.filter(s => s.timeLeft > 0);

        finished.forEach(siege => {
          finishSiege(siege);
        });

        return remaining;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSieges, troopCounts, conqueredCityIds, conqueredCountryCodes]);

  const finishSiege = (siege: {
    city: City;
    targetCountry: Country;
    targetCode: string;
    duration: number;
    playerTroopsBefore: number;
    enemyTroopsBefore: number;
  }) => {
    const { city, targetCountry, targetCode, duration, playerTroopsBefore, enemyTroopsBefore } = siege;
    
    const playerLosses = Math.min(playerTroopsBefore, enemyTroopsBefore);
    const playerRemaining = Math.max(0, playerTroopsBefore - enemyTroopsBefore);
    const enemyLosses = enemyTroopsBefore;

    const playerCities = getCountryCities(playerCode);
    setTroopCounts((prev) => {
      const next = { ...prev };
      playerCities.forEach((pc, idx) => {
        if (idx === 0) {
          next[pc.id] = playerRemaining;
        } else {
          next[pc.id] = 0;
        }
      });
      next[city.id] = 0;
      return next;
    });

    const updatedCityIds = [...conqueredCityIds, city.id];
    setConqueredCityIds(updatedCityIds);

    soundFx.playSuccess();
    addLog(
      `⚔️ SAVAŞ RAPORU: ${targetCountry.name} - ${city.name} kuşatması başarıyla tamamlandı! Feth edildi.`,
      `⚔️ BATTLE REPORT: Siege of ${city.name} (${targetCountry.name}) completed successfully! Conquered.`
    );

    const countryCities = getCountryCities(targetCode);
    const allConquered = countryCities.every((c) => updatedCityIds.includes(c.id));
    if (allConquered && !conqueredCountryCodes.includes(targetCode)) {
      setConqueredCountryCodes((prev) => [...prev, targetCode]);
      addLog(
        `👑 BÜYÜK İLHAK: ${targetCountry.name} devletinin tüm şehirleri zapt edildi ve imparatorluğumuza katıldı!`,
        `👑 GREAT ANNEXATION: All cities of ${targetCountry.name} captured and annexed into our empire!`
      );
    }

    setBattleReport({
      isOpen: true,
      city,
      targetCountry,
      winner: 'player',
      playerTroopsBefore,
      playerLosses,
      playerRemaining,
      enemyTroopsBefore,
      enemyLosses,
      duration,
    });
  };

  // Game Ticker Logs & Logs Modal State
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState<Array<LogEntry | string>>([
    {
      tr: `1 Ocak 2026: ${playerCountry.name} sancağı taht odasına çekildi. Zafer Seferi Başladı!`,
      en: `1 January 2026: The banner of ${playerCountry.name} raised in the throne room. Campaign for Victory Begins!`,
    },
    {
      tr: `Diplomatik Müttefik: Azerbaycan ile dostluk ilişkileri %100 seviyesinde.`,
      en: `Diplomatic Ally: Friendship relations with Azerbaijan at 100%.`,
    },
  ]);

  const addLog = (trMsg: string, enMsg: string) => {
    setLogs((prev) => [
      { tr: trMsg, en: enMsg },
      ...prev.slice(0, 19),
    ]);
  };

  const [showSaveToast, setShowSaveToast] = useState(false);



  // Troop March & Battle Animation States
  const [activeMarchAnimation, setActiveMarchAnimation] = useState<{
    sourceCityId: string;
    targetCityId: string;
    amount: number;
    type: 'transfer' | 'attack';
  } | null>(null);

  const [activeBattleAnimation, setActiveBattleAnimation] = useState<{
    targetCityId: string;
    winner: 'player' | 'target';
  } | null>(null);

  // Treaty / Antlaşmalar State
  const [showTreatyModal, setShowTreatyModal] = useState(false);
  const [treatySearchQuery, setTreatySearchQuery] = useState('');
  const [selectedTreatyCountryCode, setSelectedTreatyCountryCode] = useState<string>(
    WORLD_COUNTRIES.find((c) => c.code.toLowerCase() !== playerCode)?.code.toLowerCase() || 'us'
  );
  const [signedTreaties, setSignedTreaties] = useState<{
    [countryCode: string]: {
      pact: boolean;
      trade: boolean;
      alliance: boolean;
      peace: boolean;
      reparations: boolean;
    };
  }>(initialSaveData?.signedTreaties ?? {});

  const handleSignTreaty = (targetCode: string, treatyType: 'pact' | 'trade' | 'alliance' | 'peace' | 'reparations') => {
    const lower = targetCode.toLowerCase();
    const targetObj = WORLD_COUNTRIES.find((c) => c.code.toLowerCase() === lower) || playerCountry;
    
    const isCurrentlySigned = signedTreaties[lower]?.[treatyType] || false;
    const tradeCost = Math.floor(50000 * getEconomyMultiplier(lower));
    const pactCost = getPactCost(lower);

    if (treatyType === 'trade' && !isCurrentlySigned) {
      if (gold < tradeCost) {
        return;
      }
      setGold((g) => g - tradeCost);
    }

    if (treatyType === 'pact' && !isCurrentlySigned) {
      if (gold < pactCost) {
        return;
      }
      setGold((g) => g - pactCost);
    }

    soundFx.playSuccess();
    setSignedTreaties((prev) => {
      const current = prev[lower] || { pact: false, trade: false, alliance: false, peace: false, reparations: false };
      return {
        ...prev,
        [lower]: {
          ...current,
          [treatyType]: !current[treatyType]
        }
      };
    });

    if (treatyType === 'reparations') {
      setGold((g) => g + 50000);
    }

    addLog(
      `📜 ${t('diplomaticTreaty', lang)}: ${t(treatyType, lang)} ${targetObj.name} ${!isCurrentlySigned ? t('officiallySigned', lang) : t('canceled', lang)}`,
      `📜 ${t('diplomaticTreaty', lang)}: ${t(treatyType, lang)} ${targetObj.name} ${!isCurrentlySigned ? t('officiallySigned', lang) : t('canceled', lang)}`
    );
  };

  // AI Nations Autonomous Simulation Engine
  const [aiNationsData, setAiNationsData] = useState<Record<string, {
    personality: 'aggressive' | 'diplomatic' | 'economic' | 'defensive';
    aggression: number;
    gold: number;
    troops: number;
    activeWars: string[];
    allies: string[];
  }>>(() => {
    const initial: Record<string, any> = {};
    WORLD_COUNTRIES.forEach((c) => {
      const code = c.code.toLowerCase();
      const rand = Math.random();
      const personality = rand < 0.3 ? 'aggressive' : rand < 0.6 ? 'diplomatic' : rand < 0.8 ? 'economic' : 'defensive';
      initial[code] = {
        personality,
        aggression: Math.floor(Math.random() * 60) + 30,
        gold: Math.floor(Math.random() * 200000) + 50000,
        troops: getCountryCities(code).length * 15000,
        activeWars: [],
        allies: code === 'az' ? ['tr'] : [],
      };
    });
    return initial;
  });

  const runAiNationsSimulation = () => {
    const diffKey = (difficulty || initialSaveData?.difficulty || 'normal').toLowerCase();
    const aiMultiplier = diffKey === 'kolay' ? 0.6 : diffKey === 'zor' ? 1.35 : diffKey === 'kabus' ? 1.75 : 1.0;

    const eventLogTr: string[] = [];
    const eventLogEn: string[] = [];

    setAiNationsData((prev) => {
      const next = { ...prev };
      const countryList = WORLD_COUNTRIES.filter(c => c.code.toLowerCase() !== playerCode);

      if (countryList.length >= 2) {
        // Higher difficulty leads to more frequent aggressive/expansionist AI actions
        const numActions = diffKey === 'kabus' ? 3 : diffKey === 'zor' ? 2 : 1;
        for (let a = 0; a < numActions; a++) {
          const c1 = countryList[Math.floor(Math.random() * countryList.length)];
          const c2 = countryList[Math.floor(Math.random() * countryList.length)];
          if (c1.code !== c2.code) {
            const data1 = next[c1.code.toLowerCase()] || { personality: 'aggressive', aggression: 50, gold: 100000, troops: 30000, activeWars: [], allies: [] };
            const data2 = next[c2.code.toLowerCase()] || { personality: 'defensive', aggression: 40, gold: 100000, troops: 30000, activeWars: [], allies: [] };

            const aggroChance = 0.6 * aiMultiplier;
            if ((data1.personality === 'aggressive' || diffKey === 'kabus') && Math.random() < aggroChance) {
              if (!data1.activeWars.includes(c2.code.toLowerCase())) {
                data1.activeWars.push(c2.code.toLowerCase());
                eventLogTr.push(`⚔️ [Otonom AI (${difficulty.toUpperCase()}): ${c1.name}, ${c2.name} devletine karşı otonom savaş ve sefer başlattı!`);
                eventLogEn.push(`⚔️ [Autonomous AI (${difficulty.toUpperCase()}): ${c1.name} launched an autonomous military campaign against ${c2.name}!`);
              }
            } else if (data1.personality === 'diplomatic' && Math.random() < 0.6) {
              if (!data1.allies.includes(c2.code.toLowerCase())) {
                data1.allies.push(c2.code.toLowerCase());
                data2.allies.push(c1.code.toLowerCase());
                eventLogTr.push(`🤝 [Otonom AI Diplomasisi]: ${c1.name} ile ${c2.name} arasında stratejik savunma paktı imzalandı.`);
                eventLogEn.push(`🤝 [Autonomous AI Diplomacy]: ${c1.name} and ${c2.name} signed a strategic defense pact.`);
              }
            } else {
              data1.gold += Math.floor((Math.random() * 30000 + 10000) * aiMultiplier);
              data2.gold += Math.floor((Math.random() * 30000 + 10000) * aiMultiplier);
              data1.troops += Math.floor(5000 * aiMultiplier);
              eventLogTr.push(`🪙 [Otonom AI Ekonomisi]: ${c1.name} otonom olarak hazinesini ve ordusunu güçlendirdi.`);
              eventLogEn.push(`🪙 [Autonomous AI Economy]: ${c1.name} autonomously strengthened its treasury and armed forces.`);
            }

            next[c1.code.toLowerCase()] = { ...data1 };
            next[c2.code.toLowerCase()] = { ...data2 };
          }
        }
      }

      return next;
    });

    if (eventLogTr.length > 0) {
      addLog(eventLogTr[0], eventLogEn[0]);
    }
  };

  const handleSaveGame = () => {
    soundFx.playSuccess();
    try {
      const saved = localStorage.getItem('kahya_save_slots');
      const slots: any[] = saved ? JSON.parse(saved) : [];
      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const slotId = initialSaveData?.id || (slots.length > 0 ? Math.max(...slots.map((s) => s.id)) + 1 : 1);
      
      const updatedSlot = {
        id: slotId,
        characterName: heroName,
        characterClass: heroClass,
        level: turn,
        playtime: `Tur ${turn}`,
        savedAt: formattedDate,
        chapter: `Bölüm: ${playerCountry.name} Seferi (Tur ${turn})`,
        healthPercent: 100,
        difficulty: difficulty.toUpperCase(),
        countryName: playerCountry.name,
        countryCode: playerCountry.code,
        countryFlag: playerCountry.flagUrl,
        turn,
        gold,
        incomePerTurn,
        conqueredCountryCodes,
        conqueredCityIds,
        alliedCountryCodes,
        warCountryCodes,
        troopCounts,
        signedTreaties,
        cityTaxRates,
        lostCityIds,
        tributeBalance,
        cityResources,
      };

      let updatedSlots: any[];
      const existingIndex = slots.findIndex((s) => s.id === slotId);
      if (existingIndex >= 0) {
        slots[existingIndex] = updatedSlot;
        updatedSlots = [...slots];
      } else {
        updatedSlots = [updatedSlot, ...slots];
      }

      localStorage.setItem('kahya_save_slots', JSON.stringify(updatedSlots));

      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
      addLog(
        `💾 OYUN KAYDEDİLDİ: Krallık durumu ve fetihler başarıyla kaydedildi.`,
        `💾 GAME SAVED: Kingdom status and conquests successfully saved.`
      );
    } catch {
      // ignore
    }
  };

  // ====================================================================
  // VERGİ SİSTEMİ & ZAMAN MEKANİZMASI (TAX & TIME MECHANICS)
  // Formül: (Şehir Nüfusu / 5) * (Vergi Yüzdesi / 100) = 1 Aylık Kazanma
  // Her 5 dk +1 Gün geçer -> Günlük Vergi Geliri (Aylık / 30)
  // ====================================================================

  const getCityTaxRate = (cityId: string): number => {
    return cityTaxRates[cityId] ?? taxRate;
  };

  const getCountryTier = (country: Country) => {
    const stats = getCountryStats(country);
    const rankStr = stats.militaryRank;
    if (!rankStr) return 6;
    if (rankStr === 'Bölgesel Güç' || rankStr === 'Yerel Güç') return 4;
    const match = rankStr.match(/\d+/);
    if (!match) return 6;
    const rank = parseInt(match[0]);
    if (rank <= 10) return 1;
    if (rank <= 30) return 2;
    if (rank <= 60) return 3;
    if (rank <= 100) return 4;
    if (rank <= 150) return 5;
    return 6;
  };

  const getTributeIncome = (country: Country) => {
    const tier = getCountryTier(country);
    switch (tier) {
      case 1: return 50000;
      case 2: return 40000;
      case 3: return 30000;
      case 4: return 20000;
      case 5: return 10000;
      default: return 5000;
    }
  };

  const getDailyTributeIncome = () => {
    let total = 0;
    conqueredCountryCodes.forEach(code => {
      const country = WORLD_COUNTRIES.find(c => c.code.toLowerCase() === code.toLowerCase());
      if (country) {
        total += getTributeIncome(country);
      }
    });
    return total;
  };

  const setCityTaxRate = (cityId: string, rate: number) => {
    setCityTaxRates((prev) => ({
      ...prev,
      [cityId]: Math.max(5, Math.min(80, rate)),
    }));
  };

  const setGlobalCityTaxRate = (rate: number) => {
    setTaxRate(rate);
    const updated: Record<string, number> = { ...cityTaxRates };
    getAllPlayerCities().forEach((c) => {
      updated[c.id] = rate;
    });
    setCityTaxRates(updated);
  };

  const getAllPlayerCities = (): City[] => {
    const cityMap = new Map<string, City>();
    
    // 1. Player starting country cities
    getCountryCities(playerCode).forEach((c) => cityMap.set(c.id, c));

    // 2. Conquered countries' cities
    conqueredCountryCodes.forEach((code) => {
      getCountryCities(code.toLowerCase()).forEach((c) => cityMap.set(c.id, c));
    });

    // 3. Conquered individual cities
    conqueredCityIds.forEach((cityId) => {
      if (!cityMap.has(cityId)) {
        for (const country of WORLD_COUNTRIES) {
          const cCode = country.code.toLowerCase();
          const found = getCountryCities(cCode).find((c) => c.id === cityId);
          if (found) {
            cityMap.set(found.id, found);
            break;
          }
        }
      }
    });

    // Remove cities that were lost to rebellion
    const finalCities = Array.from(cityMap.values()).filter(c => !lostCityIds[c.id]);
    return finalCities;
  };

  const getCityTaxDetails = (city: City) => {
    const popNum = parsePopulationNumber(city.population);
    const rate = getCityTaxRate(city.id);
    const monthly = calculateCityMonthlyTax(popNum, rate);
    const daily = calculateCityDailyTax(popNum, rate);
    return { popNum, rate, monthly, daily };
  };

  const getTotalPlayerTaxIncome = () => {
    const cities = getAllPlayerCities();
    let totalMonthly = 0;
    let totalDaily = 0;

    cities.forEach((city) => {
      const { monthly, daily } = getCityTaxDetails(city);
      totalMonthly += monthly;
      totalDaily += daily;
    });

    return { totalMonthly, totalDaily, cityCount: cities.length, cities };
  };

  // +1 Day Advance Function (called every 5 minutes automatically or manually)
  const triggerDayAdvance = () => {
    soundFx.playSuccess();
    const { totalDaily } = getTotalPlayerTaxIncome();

    // Run AI Nations Autonomous Simulation
    runAiNationsSimulation();

    // Add daily tax to gold
    setGold((prev) => prev + totalDaily);

    // Add daily tribute to tribute balance
    const dailyTribute = getDailyTributeIncome();
    setTributeBalance((prev) => prev + dailyTribute);

    // Generate Resources
    setCityResources((prev) => {
      const newRes = { ...prev };
      const playerCities = getAllPlayerCities();
      playerCities.forEach((city) => {
        let popNum = 0;
        if (city.population.includes('Milyon')) {
          popNum = parseFloat(city.population.replace(' Milyon', '')) * 1000000;
        } else if (city.population.includes('Bin')) {
          popNum = parseFloat(city.population.replace(' Bin', '')) * 1000;
        } else {
          popNum = parseInt(city.population.replace(/\D/g, ''));
        }

        if (!newRes[city.id]) {
          newRes[city.id] = { diamonds: 0, goldOre: 0, oil: 0 };
        }
        
        let prodDiamonds = 0;
        let prodGoldOre = 0;
        let prodOil = 0;

        if (popNum < 5000000) {
          prodDiamonds = Math.floor(Math.random() * 20) + 1; // 1-20
          prodGoldOre = Math.floor(Math.random() * 20) + 1; // 1-20
          prodOil = Math.floor(Math.random() * 3) + 1; // 1-3
        } else if (popNum < 15000000) {
          prodDiamonds = Math.floor(Math.random() * 20) + 21; // 21-40
          prodGoldOre = Math.floor(Math.random() * 20) + 21; // 21-40
          prodOil = Math.floor(Math.random() * 7) + 4; // 4-10
        } else {
          prodDiamonds = Math.floor(Math.random() * 10) + 41; // 41-50
          prodGoldOre = Math.floor(Math.random() * 10) + 41; // 41-50
          prodOil = Math.floor(Math.random() * 6) + 11; // 11-16
        }

        newRes[city.id] = {
          diamonds: newRes[city.id].diamonds + prodDiamonds,
          goldOre: newRes[city.id].goldOre + prodGoldOre,
          oil: newRes[city.id].oil + prodOil,
        };
      });
      return newRes;
    });

    // Advance turn
    setTurn((prev) => prev + 1);

    // Advance Day & Month & Year
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    setDateDay((prevDay) => {
      if (prevDay >= 30) {
        setDateMonth((prevMonth) => {
          const currentMonthIndex = months.indexOf(prevMonth);
          if (currentMonthIndex === 11 || currentMonthIndex === -1) {
            setDateYear((prevYear) => prevYear + 1);
            return 'Ocak';
          } else {
            return months[currentMonthIndex + 1];
          }
        });
        return 1;
      }
      return prevDay + 1;
    });

    // Handle Rebellions
    const playerCities = getAllPlayerCities();
    const newlyLost: string[] = [];
    
    setLostCityIds((prevLost) => {
      let newLost = { ...prevLost };
      let updatedConquered = [...conqueredCityIds];
      let hasRebellion = false;

      playerCities.forEach((city) => {
        const rate = getCityTaxRate(city.id);
        if (rate > 50) {
          // Max tax is 80, so max chance is 30% per day.
          const rebelChance = (rate - 50) / 100;
          if (Math.random() < rebelChance) {
            hasRebellion = true;
            let closestCountryCode = city.countryCode.toLowerCase();
            
            // If the city was ours natively, or we want to find the true nearest neighbor
            if (closestCountryCode === playerCode || newLost[city.id]) {
              let minDistance = Infinity;
              WORLD_COUNTRIES.forEach(country => {
                 if (country.code.toLowerCase() === playerCode) return;
                 const capital = getCountryCities(country.code.toLowerCase()).find(c => c.isCapital);
                 if (capital) {
                   const dist = Math.pow(capital.lat - city.lat, 2) + Math.pow(capital.lng - city.lng, 2);
                   if (dist < minDistance) {
                     minDistance = dist;
                     closestCountryCode = country.code.toLowerCase();
                   }
                 }
              });
            }

            newLost[city.id] = closestCountryCode;
            const newOwner = WORLD_COUNTRIES.find(c => c.code.toLowerCase() === closestCountryCode)?.name || closestCountryCode;
            newlyLost.push(`${city.name} (Yeni sahibi: ${newOwner})`);
            
            const cIndex = updatedConquered.indexOf(city.id);
            if (cIndex > -1) {
              updatedConquered.splice(cIndex, 1);
            }
          }
        }
      });

      if (hasRebellion) {
        setConqueredCityIds(updatedConquered);
      }
      
      return newLost;
    });

    addLog(
      `📅 YENİ GÜN (+1 Gün): Şehir vergilerinden hazineye +${totalDaily.toLocaleString()} 🪙 aktarıldı!`,
      `📅 NEW DAY (+1 Day): +${totalDaily.toLocaleString()} 🪙 in city taxes collected into treasury!`
    );
    if (newlyLost.length > 0) {
      soundFx.playClick();
      addLog(
        `🚨 İSYAN! Yüksek vergiler nedeniyle halk isyan etti ve başka bir ülkeye katıldı: ${newlyLost.join(', ')}`,
        `🚨 REBELLION! People revolted due to high taxes and joined another nation: ${newlyLost.join(', ')}`
      );
    }
  };

  // Real-time Timer: Every 5 minutes (300s) = +1 Day
  useEffect(() => {
    const timer = setInterval(() => {
      setDayTimerSeconds((prev) => {
        if (prev <= 1) {
          triggerDayAdvance();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [dateDay, dateMonth, dateYear, cityTaxRates, conqueredCityIds, conqueredCountryCodes]);

  // Handle Turn / Day End Manually
  const handleNextTurn = () => {
    setDayTimerSeconds(300); // Reset 5-minute timer
    triggerDayAdvance();
    setDipPoints(10.0);
    setMovePoints(10.0);

    const diffKey = (difficulty || initialSaveData?.difficulty || 'normal').toLowerCase();
    const aiMultiplier = diffKey === 'kolay' ? 0.6 : diffKey === 'zor' ? 1.35 : diffKey === 'kabus' ? 1.75 : 1.0;

    // ==========================================
    // YAPAY ZEKA (AI) HAMLELERİ (GAME BOT AI)
    // ==========================================
    const newTroopCounts = { ...troopCounts };
    const newWarCountryCodes = [...warCountryCodes];
    let playerLostTroops = 0;

    WORLD_COUNTRIES.forEach((country) => {
      const code = country.code.toLowerCase();
      if (code === playerCode || conqueredCountryCodes.includes(code)) return;

      const cCities = getCountryCities(code);
      const cCapital = cCities.find(c => c.isCapital) || cCities[0];
      const capitalId = cCapital ? cCapital.id : code;
      
      const cTroops = cCities.reduce((sum, city) => sum + (newTroopCounts[city.id] || 0), 0) || (newTroopCounts[code] || 15000);

      // 1. Asker Alma (Recruit scaled by difficulty)
      if (Math.random() > (0.5 / aiMultiplier)) {
        const recruit = Math.floor((Math.random() * 2000 + 500) * aiMultiplier);
        newTroopCounts[capitalId] = (newTroopCounts[capitalId] || 0) + recruit;
      }

      // 2. Savaş İlanı (Declare War scaled by difficulty)
      const isAtWar = newWarCountryCodes.includes(code);
      const isAlly = alliedCountryCodes.includes(code);
      const rel = countryRelations[code] || 0;
      const hasPact = signedTreaties[code]?.pact;

      if (!isAtWar && !isAlly) {
        const warThreshold = diffKey === 'kabus' ? 0.85 : diffKey === 'zor' ? 0.90 : 0.95;
        if (hasPact && rel < -80 && Math.random() > (warThreshold - 0.05)) {
          newWarCountryCodes.push(code);
          setSignedTreaties(prev => ({
            ...prev,
            [code]: { ...prev[code], pact: false }
          }));
          addLog(
            `🚨 AI İHANETİ (${difficulty.toUpperCase()}): ${country.name} aranızdaki Saldırmazlık Paktını bozarak savaş ilan etti!`,
            `🚨 AI BETRAYAL (${difficulty.toUpperCase()}): ${country.name} broke the Non-Aggression Pact and declared war!`
          );
        } else if (!hasPact && (rel < -30 || diffKey === 'kabus') && Math.random() > warThreshold) {
          newWarCountryCodes.push(code);
          addLog(
            `🚨 AI HAMLESİ (${difficulty.toUpperCase()}): ${country.name} size savaş ilan etti!`,
            `🚨 AI MOVE (${difficulty.toUpperCase()}): ${country.name} declared war on you!`
          );
        }
      }

      // 3. Saldırı (Attack if at war, scaled by difficulty)
      if (newWarCountryCodes.includes(code) && Math.random() > (0.7 / aiMultiplier)) {
        const attackPower = Math.floor(cTroops * (0.2 + Math.random() * 0.3) * aiMultiplier);
        if (attackPower > 3000) {
          const pCities = getCountryCities(playerCode);
          const pTroops = pCities.reduce((sum, city) => sum + (newTroopCounts[city.id] || 0), 0) || (newTroopCounts[playerCode] || 355000);
          
          if (pTroops > attackPower) {
            // Player successfully defends
            playerLostTroops += Math.floor(attackPower * (diffKey === 'kabus' ? 0.9 : 0.7));
            if (capitalId) {
              newTroopCounts[capitalId] = Math.max(0, (newTroopCounts[capitalId] || 0) - attackPower);
            }
            addLog(
              `🛡️ AI SALDIRISI (${difficulty.toUpperCase()}): ${country.name} ülkesinin saldırısı püskürtüldü!`,
              `🛡️ AI ATTACK (${difficulty.toUpperCase()}): Attack from ${country.name} repelled!`
            );
          } else {
            // Player loses heavily
            playerLostTroops += pTroops;
            addLog(
              `❌ AI BAŞARISI (${difficulty.toUpperCase()}): ${country.name} ağır bir saldırı gerçekleştirdi!`,
              `❌ AI SUCCESS (${difficulty.toUpperCase()}): ${country.name} launched a heavy assault!`
            );
          }
        }
      }
    });

    if (playerLostTroops > 0) {
      const pCities = getCountryCities(playerCode);
      const pCapital = pCities.find(c => c.isCapital) || pCities[0];
      if (pCapital) {
        newTroopCounts[pCapital.id] = Math.max(0, (newTroopCounts[pCapital.id] || 0) - playerLostTroops);
      }
    }

    setTroopCounts(newTroopCounts);
    setWarCountryCodes(newWarCountryCodes);

    addLog(
      `Gün ${dateDay} ${dateMonth} ${dateYear} (Tur ${turn}): Günlük vergi ve bütçe güncellendi.`,
      `Day ${dateDay} ${dateMonth} ${dateYear} (Turn ${turn}): Daily taxes and budget updated.`
    );
  };

  // Selected Country Object
  const selectedCountryObj = WORLD_COUNTRIES.find(
    (c) => c.code.toLowerCase() === selectedCountryCode?.toLowerCase()
  ) || playerCountry;

  const selectedCityObj = selectedCityId ? getCountryCities(selectedCountryObj.code).find(c => c.id === selectedCityId) : null;

  const isPlayerSelected = selectedCountryCode?.toLowerCase() === playerCode;
  const isConquered = conqueredCountryCodes.includes(selectedCountryCode?.toLowerCase() || '');
  const isCityConquered = selectedCityObj ? (conqueredCityIds.includes(selectedCityObj.id) || isConquered) : false;
  const isOwnRegion = isPlayerSelected || isConquered || isCityConquered || (selectedCityObj && selectedCityObj.countryCode.toLowerCase() === playerCode);
  const isAtWar = warCountryCodes.includes(selectedCountryCode?.toLowerCase() || '');
  const isAlly = alliedCountryCodes.includes(selectedCountryCode?.toLowerCase() || '');
  const relationScore = countryRelations[selectedCountryCode?.toLowerCase() || ''] || 0;

  // Actions
  const handleDeclareWar = () => {
    if (!selectedCountryCode || isPlayerSelected) return;
    soundFx.playClick();

    if (!warCountryCodes.includes(selectedCountryCode)) {
      const hadTreaties = signedTreaties[selectedCountryCode];
      const hadPact = hadTreaties?.pact;
      setWarCountryCodes((prev) => [...prev, selectedCountryCode]);
      setCountryRelations((prev) => ({ 
        ...prev, 
        [selectedCountryCode]: -100
      }));
      setDipPoints((d) => Math.max(0, d - 0.2));
      
      setSignedTreaties(prev => ({
        ...prev,
        [selectedCountryCode]: {
          pact: false,
          trade: false,
          alliance: false,
          peace: false,
          reparations: false
        }
      }));

      if (hadPact) {
        addLog(
          `🚨 İHANET: ${selectedCountryObj.name} ile olan antlaşmalar bozularak savaş ilan edildi!`,
          `🚨 BETRAYAL: Treaties with ${selectedCountryObj.name} broken and war declared!`
        );
      } else {
        addLog(
          `🚨 SAVAŞ İLANI: ${playerCountry.name}, ${selectedCountryObj.name} ülkesine resmi savaş ilan etti!`,
          `🚨 WAR DECLARED: ${playerCountry.name} officially declared war on ${selectedCountryObj.name}!`
        );
      }
    }
  };

  const handleAttackCountry = () => {
    if (!selectedCountryCode || isPlayerSelected) return;
    soundFx.playClick();

    if (!warCountryCodes.includes(selectedCountryCode)) {
      const hadTreaties = signedTreaties[selectedCountryCode];
      const hadPact = hadTreaties?.pact;
      setWarCountryCodes((prev) => [...prev, selectedCountryCode]);
      setCountryRelations((prev) => ({
        ...prev,
        [selectedCountryCode]: -100
      }));
      setDipPoints((d) => Math.max(0, d - 0.2));

      setSignedTreaties(prev => ({
        ...prev,
        [selectedCountryCode]: {
          pact: false,
          trade: false,
          alliance: false,
          peace: false,
          reparations: false
        }
      }));

      if (hadPact) {
        addLog(
          `🚨 İHANET: ${selectedCountryObj.name} ile olan antlaşmalar bozup saldırdınız! Diplomatik itibarınız azaldı.`,
          `🚨 BETRAYAL: You broke treaties with ${selectedCountryObj.name} and attacked! Diplomatic reputation decreased.`
        );
      } else {
        addLog(
          `🚨 BEKLENMEDİK SALDIRI: ${playerCountry.name}, ${selectedCountryObj.name} ülkesine habersiz saldırdı ve savaş başladı!`,
          `🚨 SURPRISE ATTACK: ${playerCountry.name} launched a surprise attack on ${selectedCountryObj.name}! War started!`
        );
      }
    }

    const pCities = getCountryCities(playerCode);
    const pCapital = pCities.find(c => c.isCapital) || pCities[0];
    const tCities = getCountryCities(selectedCountryCode);
    const tCapital = tCities.find(c => c.isCapital) || tCities[0];

    if (!pCapital || !tCapital) return;

    const pTroops = pCities.reduce((sum, c) => sum + (troopCounts[c.id] || 0), 0) || (troopCounts[pCapital.id] || 100000);
    const tTroops = tCities.reduce((sum, c) => sum + (troopCounts[c.id] || 0), 0) || (troopCounts[tCapital.id] || 100000);

    // Trigger marching & battle animation
    setActiveMarchAnimation({
      sourceCityId: pCapital.id,
      targetCityId: tCapital.id,
      amount: Math.floor(pTroops * 0.4),
      type: 'attack',
    });

    // Simulate battle outcomes
    const playerRoll = Math.random() * pTroops * 1.2;
    const targetRoll = Math.random() * tTroops * 0.9;

    const winner = playerRoll >= targetRoll ? 'player' : 'target';
    const playerLosses = winner === 'player' ? Math.min(pTroops, tTroops) : Math.floor(pTroops * 0.35);
    const targetLosses = Math.floor(tTroops * (winner === 'player' ? 1.0 : 0.4));

    setActiveBattleAnimation({
      targetCityId: tCapital.id,
      winner,
    });

    setTimeout(() => {
      setActiveMarchAnimation(null);
      setActiveBattleAnimation(null);
    }, 3000);

    setBattleState({
      isOpen: true,
      targetCountry: selectedCountryObj,
      playerTroops: pTroops,
      targetTroops: tTroops,
      winner,
      playerLosses,
      targetLosses,
    });

    // Update Troop Counts
    setTroopCounts((prev) => ({
      ...prev,
      [pCapital.id]: Math.max(1000, (prev[pCapital.id] || 0) - playerLosses),
      [tCapital.id]: Math.max(0, (prev[tCapital.id] || 0) - targetLosses),
    }));

    if (winner === 'player') {
      if (!conqueredCountryCodes.includes(selectedCountryCode)) {
        setConqueredCountryCodes((prev) => [...prev, selectedCountryCode]);
      }
      addLog(
        `⚔️ BÜYÜK ZAFER! ${selectedCountryObj.name} orduları mağlup edildi ve ülkesi ilhak edildi!`,
        `⚔️ GREAT VICTORY! Armies of ${selectedCountryObj.name} defeated and country annexed!`
      );
    } else {
      addLog(
        `⚠️ MUHAREBE KAYBI: ${selectedCountryObj.name} savunma hattı kırılamadı. Birliklerimiz geri çekildi.`,
        `⚠️ BATTLE LOSS: Defensive line of ${selectedCountryObj.name} could not be breached. Troops retreated.`
      );
    }
  };

  const handleConquerCity = (city: City) => {
    const targetCode = city.countryCode.toLowerCase();
    const isTargetPlayer = targetCode === playerCode;
    if (isTargetPlayer || conqueredCityIds.includes(city.id)) return;
    soundFx.playClick();

    const targetCountry = WORLD_COUNTRIES.find(c => c.code.toLowerCase() === targetCode) || playerCountry;

    // Check for pact and auto-declare war if attacking
    if (!warCountryCodes.includes(targetCode)) {
      const hadTreaties = signedTreaties[targetCode];
      const hadPact = hadTreaties?.pact;
      setWarCountryCodes(prev => [...prev, targetCode]);
      setCountryRelations(prev => ({
        ...prev,
        [targetCode]: -100
      }));
      setDipPoints((d) => Math.max(0, d - 0.2));

      setSignedTreaties(prev => ({
        ...prev,
        [targetCode]: {
          pact: false,
          trade: false,
          alliance: false,
          peace: false,
          reparations: false
        }
      }));

      if (hadPact) {
        addLog(
          `🚨 İHANET: ${targetCountry.name} ile olan antlaşmalar bozup saldırdınız! Diplomatik itibarınız azaldı.`,
          `🚨 BETRAYAL: You broke treaties with ${targetCountry.name} and attacked! Diplomatic reputation decreased.`
        );
      } else {
        addLog(
          `🚨 BEKLENMEDİK SALDIRI: ${playerCountry.name}, ${targetCountry.name} ülkesine habersiz saldırdı ve savaş başladı!`,
          `🚨 SURPRISE ATTACK: ${playerCountry.name} launched a surprise attack on ${targetCountry.name}! War started!`
        );
      }
    }

    const playerCities = getCountryCities(playerCode);
    const pTroops = playerCities.reduce((sum, c) => sum + (troopCounts[c.id] || 0), 0);
    const enemyTroops = getCityTroops(city.id, city.countryCode);

    if (activeSieges.length >= 2) {
      soundFx.playClick();
      addLog(
        `⚠️ MAKSİMUM SAVAŞ SINIRI: Aynı anda en fazla 2 savaş (sefer) yürütebilirsiniz! Başka bir sefer başlatmak için devam eden kuşatmanın bitmesini bekleyin.`,
        `⚠️ MAX WAR LIMIT: You can conduct a maximum of 2 wars simultaneously! Wait for ongoing sieges to conclude.`
      );
      return;
    }

    // Prompt user with confirmation modal instead of starting immediately
    setPendingSiegeCity({
      city,
      targetCountry,
      targetCode,
      enemyTroops,
      playerTroops: pTroops,
    });
  };

  const confirmAndStartSiege = () => {
    if (!pendingSiegeCity) return;
    const { city, targetCountry, targetCode, enemyTroops, playerTroops } = pendingSiegeCity;
    setPendingSiegeCity(null);

    if (activeSieges.length >= 2) {
      addLog(
        `⚠️ MAKSİMUM SAVAŞ SINIRI: Aynı anda en fazla 2 savaş yürütebilirsiniz!`,
        `⚠️ MAX WAR LIMIT: You can conduct a maximum of 2 wars simultaneously!`
      );
      return;
    }

    soundFx.playSuccess();

    const playerCities = getCountryCities(playerCode);
    const playerCapital = playerCities.find(c => c.isCapital) || playerCities[0];

    setActiveMarchAnimation({
      sourceCityId: playerCapital ? playerCapital.id : playerCities[0].id,
      targetCityId: city.id,
      amount: Math.floor(enemyTroops * 0.8),
      type: 'attack',
    });

    setActiveBattleAnimation({
      targetCityId: city.id,
      winner: 'player',
    });

    setTimeout(() => {
      setActiveMarchAnimation(null);
      setActiveBattleAnimation(null);
    }, 3000);

    let duration = 30;
    if (enemyTroops >= 200000) {
      duration = Math.floor(Math.random() * 11) + 110; // 110 - 120 sn
    } else if (enemyTroops >= 170000) {
      duration = Math.floor(Math.random() * 20) + 90; // 90 - 109 sn
    } else if (enemyTroops >= 130000) {
      duration = Math.floor(Math.random() * 15) + 75; // 75 - 89 sn
    } else if (enemyTroops >= 100000) {
      duration = Math.floor(Math.random() * 15) + 60; // 60 - 74 sn
    } else if (enemyTroops >= 70000) {
      duration = Math.floor(Math.random() * 15) + 45; // 45 - 59 sn
    } else {
      duration = Math.floor(Math.random() * 20) + 25; // 25 - 44 sn
    }

    const newSiege = {
      id: `${city.id}-${Date.now()}`,
      city,
      targetCountry,
      targetCode,
      duration,
      timeLeft: duration,
      playerTroopsBefore: playerTroops,
      enemyTroopsBefore: enemyTroops,
    };

    setActiveSieges((prev) => [...prev, newSiege]);

    addLog(
      `⚔️ KUŞATMA BAŞLATILDI: ${targetCountry.name} - ${city.name} şehri kuşatıldı. Savaş Süresi: ${duration} saniye.`,
      `⚔️ SIEGE STARTED: ${city.name} (${targetCountry.name}) under siege. Duration: ${duration} seconds.`
    );
  };

  const handleImproveRelations = () => {
    if (gold < 15000 || !selectedCountryCode) return;
    soundFx.playSuccess();
    setGold((g) => g - 15000);
    setCountryRelations((prev) => ({
      ...prev,
      [selectedCountryCode]: Math.min(100, (prev[selectedCountryCode] || 0) + 20),
    }));
    addLog(
      `🕊️ Diplomatik elçi gönderildi: ${selectedCountryObj.name} ile ilişkiler +20 yükseldi.`,
      `🕊️ Diplomatic envoy sent: Relations with ${selectedCountryObj.name} improved by +20.`
    );
  };

  const handleFormAlliance = () => {
    if (!selectedCountryCode || isAlly) return;
    soundFx.playSuccess();
    setAlliedCountryCodes((prev) => [...prev, selectedCountryCode]);
    setCountryRelations((prev) => ({ ...prev, [selectedCountryCode]: 100 }));
    addLog(
      `🤝 İTTİFAK PAKTI: ${playerCountry.name} ile ${selectedCountryObj.name} askeri ittifak kurdu!`,
      `🤝 ALLIANCE PACT: ${playerCountry.name} and ${selectedCountryObj.name} formed a military alliance!`
    );
  };

  const handleRecruitTroops = () => {
    if (gold < 20000) return;
    soundFx.playSuccess();
    setGold((g) => g - 20000);
    const pCities = getCountryCities(playerCode);
    const playerCapital = pCities.find(c => c.isCapital) || pCities[0];
    const capId = playerCapital ? playerCapital.id : playerCode;
    setTroopCounts((prev) => ({
      ...prev,
      [capId]: (prev[capId] || 0) + 25000,
    }));
    addLog(
      `⚔️ ORDUSAL MEKANİZASYON: Sancağa +25,000 eğitimli savaşçı katıldı.`,
      `⚔️ MILITARY DRAFT: +25,000 trained soldiers joined the banner.`
    );
  };

  const getPlayerTotalResources = () => {
    let diamonds = 0, goldOre = 0, oil = 0;
    getAllPlayerCities().forEach(c => {
      const res = cityResources[c.id];
      if (res) {
        diamonds += res.diamonds;
        goldOre += res.goldOre;
        oil += res.oil;
      }
    });
    return { diamonds, goldOre, oil };
  };

  const handlePerformTrade = () => {
    if (tradeAmount <= 0 || !showTradeModal) return;
    
    let pricePerUnit = 0;
    let typeName = '';
    let unit = '';
    
    if (tradeResourceType === 'diamonds') {
      pricePerUnit = 500;
      typeName = 'Elmas';
      unit = 'gram';
    } else if (tradeResourceType === 'goldOre') {
      pricePerUnit = 300;
      typeName = 'Altın Cevheri';
      unit = 'gram';
    } else if (tradeResourceType === 'oil') {
      pricePerUnit = 1000;
      typeName = 'Petrol';
      unit = 'L';
    }

    const targetCountryCode = showTradeModal;
    const targetCountryName = WORLD_COUNTRIES.find(c => c.code === targetCountryCode)?.name || 'Yabancı Ülke';
    
    const multiplier = getEconomyMultiplier(targetCountryCode);
    pricePerUnit = Math.floor(pricePerUnit * multiplier);

    const profit = tradeAmount * pricePerUnit;

    let amountLeft = tradeAmount;
    const newCityResources = { ...cityResources };

    getAllPlayerCities().forEach(c => {
      if (amountLeft <= 0) return;
      if (!newCityResources[c.id]) return;

      const cityAmt = newCityResources[c.id][tradeResourceType];
      if (cityAmt > 0) {
        const deduct = Math.min(cityAmt, amountLeft);
        newCityResources[c.id] = {
          ...newCityResources[c.id],
          [tradeResourceType]: cityAmt - deduct
        };
        amountLeft -= deduct;
      }
    });

    soundFx.playSuccess();
    setGold(g => g + profit);
    setCityResources(newCityResources);
    
    addLog(
      `🤝 TİCARET: ${targetCountryName} ile anlaşma yapıldı. ${tradeAmount.toLocaleString()} ${unit} ${typeName} satıldı (+${profit.toLocaleString()} 🪙).`,
      `🤝 TRADE: Trade deal with ${targetCountryName}. Sold ${tradeAmount.toLocaleString()} ${unit} ${typeName} (+${profit.toLocaleString()} 🪙).`
    );
    
    setShowTradeModal(null);
    setTradeAmount(0);
  };

  const handleInvestEconomy = () => {
    if (gold < 30000) return;
    soundFx.playSuccess();
    setGold((g) => g - 30000);
    setIncomePerTurn((inc) => inc + 1200);
    addLog(
      `🏗️ EKONOMİK ATILIM: Sanayi ve altyapı yatırımları ile tur geliri +1,200 Altın arttı.`,
      `🏗️ ECONOMIC BOOST: Turn income increased by +1,200 Gold through industry and infrastructure investments.`
    );
  };

  // Custom Recruitment via Selected Unit Type & Slider (With Training Time)
  const handleRecruitCustomTroops = () => {
    const targetKey = selectedCityId || selectedCountryCode;
    const unit = TROOP_UNITS.find(u => u.id === selectedUnitType) || TROOP_UNITS[0];
    const totalCost = recruitSliderAmount * unit.cost;
    if (!targetKey || gold < totalCost || recruitSliderAmount < 1) return;

    if (trainingQueues.length >= 3) {
      soundFx.playClick();
      addLog(
        `⚠️ KIŞLA DOLU: Aynı anda en fazla 3 askeri eğitim kuyruğu oluşturulabilir.`,
        `⚠️ BARRACKS FULL: Maximum 3 training queues can be created simultaneously.`
      );
      return;
    }
    
    soundFx.playSuccess();
    setGold((g) => g - totalCost);
    const powerAdded = Math.round(recruitSliderAmount * unit.powerMult);
    const placeName = selectedCityObj ? selectedCityObj.name : selectedCountryObj.name;

    // Calculate training time: trainTimePer1k seconds per 1,000 units (minimum 2 seconds)
    const trainSeconds = Math.max(2, Math.round((recruitSliderAmount / 1000) * unit.trainTimePer1k));

    const newQueueItem = {
      id: `${unit.id}-${Date.now()}`,
      unitId: unit.id,
      unitName: t(unit.nameKey, lang),
      unitIcon: unit.icon,
      targetKey,
      placeName,
      amount: recruitSliderAmount,
      powerAdded,
      duration: trainSeconds,
      timeLeft: trainSeconds,
    };

    setTrainingQueues((prev) => [...prev, newQueueItem]);

    addLog(
      `🪖 ${t('trainingStarted', lang)}: ${placeName} kışlasında ${recruitSliderAmount.toLocaleString()} ${unit.icon} ${t(unit.nameKey, lang)} eğitimi başlatıldı. Tamamlanma süresi: ${trainSeconds} sn (${totalCost.toLocaleString()} 🪙 harcandı).`,
      `🪖 ${t('trainingStarted', lang)}: Training ${recruitSliderAmount.toLocaleString()} ${unit.icon} ${getUnitName(unit.id, 'English')} in ${placeName}. Est. time: ${trainSeconds}s (${totalCost.toLocaleString()} 🪙 spent).`
    );
  };

  // Start Transfer Mode to select a target city on the map
  const handleStartTransferMode = () => {
    const activeKey = selectedCityId || selectedCountryCode;
    if (!activeKey) return;
    const currentTroops = troopCounts[activeKey] || 0;
    if (currentTroops <= 100) {
      addLog(
        `⚠️ YETERSİZ BİRLİK: Bu şehirde/bölgede sevk edilecek yeterli asker bulunmuyor!`,
        `⚠️ INSUFFICIENT TROOPS: Not enough soldiers to transfer in this city/region!`
      );
      return;
    }
    setTransferSourceCityId(activeKey);
    soundFx.playClick();
  };

  // Handle map click for normal selection OR transfer target selection
  const handleSelectCountryFromMap = (code: string) => {
    const lowerCode = code.toLowerCase();
    
    // If in attack mode, try to attack the capital of the clicked country
    if (isAttackMode) {
      if (lowerCode !== playerCode && !conqueredCountryCodes.includes(lowerCode)) {
        const cities = getCountryCities(lowerCode);
        const capital = cities.find(c => c.isCapital) || cities[0];
        if (capital && !conqueredCityIds.includes(capital.id)) {
          setSelectedCountryCode(lowerCode);
          handleConquerCity(capital);
          setIsAttackMode(false);
          return;
        }
      } else if (lowerCode === playerCode) {
        setIsAttackMode(false);
      }
    }

    setSelectedCountryCode(lowerCode);
    
    // Select the capital or first city of the selected country by default for city selection mechanism
    const cities = getCountryCities(lowerCode);
    const capital = cities.find(c => c.isCapital) || cities[0];
    if (capital) {
      setSelectedCityId(capital.id);
    } else {
      setSelectedCityId(null);
    }
    
    if (transferSourceCityId) {
      if (capital) {
        if (capital.id === transferSourceCityId) {
          return;
        }
        setTransferTargetCityId(capital.id);
        const sourceTroops = troopCounts[transferSourceCityId] || 10000;
        const maxAvailable = Math.max(100, sourceTroops - 100);
        setTransferAmount(Math.min(20000, maxAvailable));
        setShowTransferModal(true);
        soundFx.playClick();
      }
    }
  };

  const handleSelectCityFromMap = (cityId: string, code: string) => {
    const lowerCode = code.toLowerCase();
    setSelectedCityId(cityId);
    setSelectedCountryCode(lowerCode);

    // If in transfer mode, select target city
    if (transferSourceCityId) {
      if (cityId === transferSourceCityId) {
        setSelectedCountryCode(lowerCode);
        return;
      }
      setTransferTargetCityId(cityId);
      const sourceTroops = troopCounts[transferSourceCityId] || 0;
      const maxAvailable = Math.max(100, sourceTroops - 100);
      setTransferAmount(Math.min(20000, maxAvailable));
      setShowTransferModal(true);
      soundFx.playClick();
      return;
    }

    // If in attack mode, try to conquer the city
    if (isAttackMode) {
      const cities = getCountryCities(lowerCode);
      const city = cities.find(c => c.id === cityId);
      
      const isPlayerSelected = lowerCode === playerCode;
      const isConqueredCity = conqueredCityIds.includes(cityId);

      if (city && !isPlayerSelected && !isConqueredCity) {
        handleConquerCity(city);
        setIsAttackMode(false); // Reset attack mode after attempt
        return;
      }
    }

    if (!transferSourceCityId) {
      setSelectedCountryCode(lowerCode);
    }
  };

  const handleStartAttackMode = () => {
    if (isAttackMode) {
      setIsAttackMode(false);
      return;
    }
    
    const allPlayerCities = getAllPlayerCities();
    const playerTroops = allPlayerCities.reduce((sum, c) => sum + (troopCounts[c.id] || 0), 0) + (troopCounts[playerCode] || 0);
    
    if (playerTroops < 20000 && Object.keys(troopCounts).length > 0) {
      addLog(
        `⚠️ YETERSİZ ORDU: Sefer başlatmak için en az 20,000 askere ihtiyacınız var!`,
        `⚠️ INSUFFICIENT ARMY: You need at least 20,000 soldiers to launch a campaign!`
      );
      return;
    }

    setIsAttackMode(true);
    soundFx.playClick();
    addLog(
      `⚔️ SEFER EMRİ: Bir hedef şehir seçerek saldırıyı başlatın!`,
      `⚔️ CAMPAIGN ORDER: Select a target city to launch the attack!`
    );
  };

  // Execute Troop Transfer / March Attack
  const handleConfirmTransfer = () => {
    if (!transferSourceCityId || !transferTargetCityId) return;

    const sourceTroops = troopCounts[transferSourceCityId] || 0;
    const actualMove = Math.min(transferAmount, sourceTroops);

    if (actualMove <= 0) return;

    const isTargetOwned = conqueredCityIds.includes(transferTargetCityId) || 
                          WORLD_COUNTRIES.find(c => getCountryCities(c.code.toLowerCase()).some(city => city.id === transferTargetCityId))?.code.toLowerCase() === playerCode;

    setActiveMarchAnimation({
      sourceCityId: transferSourceCityId,
      targetCityId: transferTargetCityId,
      amount: actualMove,
      type: isTargetOwned ? 'transfer' : 'attack',
    });

    if (!isTargetOwned) {
      // Simulate battle outcome for animation check
      const targetTroops = troopCounts[transferTargetCityId] || 5000;
      const playerRoll = Math.random() * actualMove * 1.25;
      const targetRoll = Math.random() * targetTroops * 0.9;
      const winner = playerRoll >= targetRoll ? 'player' : 'target';

      setActiveBattleAnimation({
        targetCityId: transferTargetCityId,
        winner,
      });
    }

    setTimeout(() => {
      setActiveMarchAnimation(null);
      setActiveBattleAnimation(null);
    }, 3000);

    if (isTargetOwned) {
      // Direct transfer to owned province
      setTroopCounts((prev) => ({
        ...prev,
        [transferSourceCityId]: Math.max(0, (prev[transferSourceCityId] || 0) - actualMove),
        [transferTargetCityId]: (prev[transferTargetCityId] || 0) + actualMove,
      }));
      soundFx.playSuccess();
      addLog(
        `🚚 BİRLİK SEVKİYATI: Şehirler arası ${actualMove.toLocaleString()} asker sevk edildi.`,
        `🚚 TROOP SHIPMENT: Transferred ${actualMove.toLocaleString()} soldiers between cities.`
      );
    } else {
      // Attack / March against foreign or enemy city
      const targetTroops = troopCounts[transferTargetCityId] || 5000;
      const targetCountry = WORLD_COUNTRIES.find(c => getCountryCities(c.code.toLowerCase()).some(city => city.id === transferTargetCityId)) || playerCountry;
      const targetCountryCode = targetCountry.code.toLowerCase();

      // Check for pact and auto-declare war if attacking
      if (!warCountryCodes.includes(targetCountryCode)) {
        const hadTreaties = signedTreaties[targetCountryCode];
        const hadPact = hadTreaties?.pact;
        setWarCountryCodes(prev => [...prev, targetCountryCode]);
        setCountryRelations(prev => ({
          ...prev,
          [targetCountryCode]: -100
        }));
        setDipPoints((d) => Math.max(0, d - 0.2));

        setSignedTreaties(prev => ({
          ...prev,
          [targetCountryCode]: {
            pact: false,
            trade: false,
            alliance: false,
            peace: false,
            reparations: false
          }
        }));

        if (hadPact) {
          addLog(
            `🚨 İHANET: ${targetCountry.name} ile olan antlaşmalar bozup saldırdınız! Diplomatik itibarınız azaldı.`,
            `🚨 BETRAYAL: You broke treaties with ${targetCountry.name} and attacked! Diplomatic reputation decreased.`
          );
        } else {
          addLog(
            `🚨 BEKLENMEDİK SALDIRI: ${playerCountry.name}, ${targetCountry.name} ülkesine habersiz saldırdı ve savaş başladı!`,
            `🚨 SURPRISE ATTACK: ${playerCountry.name} launched a surprise attack on ${targetCountry.name}! War started!`
          );
        }
      }

      const playerRoll = Math.random() * actualMove * 1.25;
      const targetRoll = Math.random() * targetTroops * 0.9;
      const winner = playerRoll >= targetRoll ? 'player' : 'target';

      const playerLosses = winner === 'player' ? Math.min(actualMove, targetTroops) : Math.floor(actualMove * 0.6);
      const targetLosses = Math.floor(targetTroops * (winner === 'player' ? 1.0 : 0.4));
      const survivingAttackers = Math.max(0, actualMove - playerLosses);

      setBattleState({
        isOpen: true,
        targetCountry,
        playerTroops: actualMove,
        targetTroops,
        winner,
        playerLosses,
        targetLosses,
      });

      setTroopCounts((prev) => {
        const nextSource = Math.max(0, (prev[transferSourceCityId] || 0) - actualMove);
        if (winner === 'player') {
          return {
            ...prev,
            [transferSourceCityId]: nextSource,
            [transferTargetCityId]: survivingAttackers,
          };
        } else {
          return {
            ...prev,
            [transferSourceCityId]: nextSource,
            [transferTargetCityId]: Math.max(0, targetTroops - targetLosses),
          };
        }
      });

      if (winner === 'player') {
        if (!conqueredCityIds.includes(transferTargetCityId)) {
          setConqueredCityIds((prev) => [...prev, transferTargetCityId]);
        }
        soundFx.playSuccess();
        setLogs((prev) => [
          `⚔️ ZAFERLE SONUÇLANAN SEFER: Şehir başarıyla feth edildi!`,
          ...prev.slice(0, 5),
        ]);
      } else {
        soundFx.playClick();
        setLogs((prev) => [
          `💀 YENİLGİ: Saldırı başarısız oldu, birliklerimiz geri çekilmek zorunda kaldı.`,
          ...prev.slice(0, 5),
        ]);
      }
    }

    // Cleanup
    setShowTransferModal(false);
    setTransferSourceCityId(null);
    setTransferTargetCityId(null);
  };

  const handleInvestProvince = () => {
    if (!selectedCountryCode || gold < 30000) return;
    soundFx.playSuccess();
    setGold((g) => g - 30000);
    setIncomePerTurn((inc) => inc + 1500);
    const placeName = selectedCityObj ? selectedCityObj.name : selectedCountryObj.name;
    setLogs((prev) => [
      `🏗️ EYALET ATILIMI: ${placeName} toprağında sanayi ve ticaret geliştirildi (+1.5k/tur).`,
      ...prev.slice(0, 5),
    ]);
  };

  const selectedStats = getCountryStats(selectedCountryObj);

  return (
    <div className="fixed inset-0 z-40 bg-[#050811] text-slate-100 flex flex-col font-cinzel overflow-hidden select-none">
      {/* Active Sieges Floating Banners (Max 2) */}
      {activeSieges.map((siege, index) => (
        <div key={`siege-${siege.id || index}`} className="bg-red-950/95 border-b border-red-800/80 px-4 py-2 flex items-center justify-between text-xs font-cinzel text-red-200 shadow-lg z-40 relative">
          <div className="flex items-center space-x-2">
            <Swords className="w-4 h-4 text-red-500 animate-pulse" />
            <span>SAVAŞ SEFERİ #{index + 1}: <strong className="text-white">{siege.targetCountry.name}</strong> ({siege.city.name})</span>
          </div>
          <div className="flex items-center space-x-3 font-mono">
            <span>Kalan Süre: <strong className="text-amber-400 text-sm">{siege.timeLeft} sn</strong></span>
            <div className="w-28 bg-slate-900 h-2 rounded-full overflow-hidden border border-red-900">
              <div 
                className="bg-red-500 h-full transition-all duration-1000"
                style={{ width: `${Math.max(0, Math.min(100, (siege.timeLeft / siege.duration) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Active Troop Training Queues Floating Banners */}
      {trainingQueues.map((item, index) => (
        <div key={`training-${item.id || index}`} className="bg-emerald-950/95 border-b border-emerald-800/80 px-4 py-2 flex items-center justify-between text-xs font-cinzel text-emerald-200 shadow-lg z-40 relative">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>
              ASKERİ EĞİTİM #{index + 1}: <strong className="text-white">{item.placeName}</strong> ({item.amount.toLocaleString()} {item.unitIcon} {item.unitName})
            </span>
          </div>
          <div className="flex items-center space-x-3 font-mono">
            <span>Kalan Süre: <strong className="text-emerald-300 text-sm">{item.timeLeft} sn</strong></span>
            <div className="w-28 bg-slate-900 h-2 rounded-full overflow-hidden border border-emerald-900">
              <div 
                className="bg-emerald-500 h-full transition-all duration-1000"
                style={{ width: `${Math.max(0, Math.min(100, (item.timeLeft / item.duration) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      {/* Age of History Top Strategy HUD */}
      <div className="px-3 py-1.5 bg-slate-950/95 border-b border-slate-800/80 flex flex-nowrap items-center justify-between gap-2 shadow-2xl backdrop-blur-md z-30 overflow-x-auto min-w-0">
        {/* Left: Age of History II Style Flag Box */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div 
            className="flex flex-col items-center w-28 h-12 bg-slate-950 border-2 border-slate-700/90 rounded-md shadow-2xl overflow-hidden cursor-pointer hover:border-amber-500/80 transition relative"
            title={`${playerCountry.name} (${heroName}) - ${t('openKingdomMenu', lang)}`}
            onClick={() => {
              soundFx.playClick();
              setIsPlayerMenuOpen(true);
            }}
          >
            {/* Country Flag Image with Waving Cloth Effect */}
            <div className="w-full h-full relative overflow-hidden animate-flag-wave">
              <img
                src={playerCountry.flagUrl}
                alt={playerCountry.name}
                className="w-full h-full object-cover scale-105"
              />
              {/* Fabric Waving Ripple & Light Fold Overlay */}
              <div className="absolute inset-0 fabric-overlay pointer-events-none" />
            </div>
            <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent text-[9.5px] font-bold text-slate-100 text-center truncate px-0.5 font-cinzel tracking-wider drop-shadow-md">
              {playerCountry.name.toUpperCase()}
            </div>
          </div>

          {/* Ana Menü Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsExitConfirmOpen(true);
            }}
            className="flex flex-col items-center justify-center space-y-0.5 px-2.5 py-2 text-[10px] font-bold text-slate-300 hover:text-red-400 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 transition font-cinzel shadow-sm cursor-pointer"
            title={t('returnToMenu', lang)}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{t('menu', lang)}</span>
          </button>
        </div>

        {/* Center: Date & Map Modes Switcher Bar */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Date & 5-Min Timer Countdown Display */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg font-mono shadow-md">
            <span className="text-xs font-bold text-amber-300 whitespace-nowrap">
              {dateDay} {translateMonth(dateMonth, lang)} {dateYear}
            </span>
            <div 
              className="flex items-center space-x-1 px-2 py-0.5 bg-slate-950 border border-amber-500/50 rounded text-[10px] text-amber-400 font-mono shadow-inner"
              title={lang === 'English' ? 'Every 5 minutes, +1 day advances and city tax income is added to treasury' : 'Her 5 Dakikada +1 Gün Geçer ve Şehir Vergi Geliri Hazineye Aktarılır'}
            >
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{t('plusOneDay', lang)}: {Math.floor(dayTimerSeconds / 60).toString().padStart(2, '0')}:{(dayTimerSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Map Modes Switcher Bar */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-cinzel shadow-inner">
            {(['political', 'economy', 'population', 'military', 'relations'] as MapMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  soundFx.playClick();
                  setMapMode(mode);
                }}
                className={`px-2 py-0.5 rounded transition font-bold whitespace-nowrap ${
                  mapMode === mode
                    ? 'bg-amber-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {mode === 'political' && t('political', lang)}
                {mode === 'economy' && t('economy', lang)}
                {mode === 'population' && t('population', lang)}
                {mode === 'military' && t('military', lang)}
                {mode === 'relations' && t('diplomacy', lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Action Buttons (Bütçe, Antlaşmalar, Kaydet) + Resources (Diplomasi, Askeri Güç, Para) */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* 2 Action Buttons: Antlaşmalar, Kaydet */}
          <div className="flex items-center space-x-1.5">
            {/* 1. Antlaşmalar ve Diplomasi */}
            <button
              onClick={() => {
                soundFx.playClick();
                setShowTreatyModal(true);
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 hover:text-emerald-200 font-bold text-[11px] rounded-lg transition shadow-md font-cinzel whitespace-nowrap"
              title={t('treatiesBtn', lang)}
            >
              <Scroll className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('treatiesBtn', lang)}</span>
            </button>

            {/* Oyunu Kaydet */}
            <button
              onClick={handleSaveGame}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/80 text-blue-300 hover:text-blue-200 font-bold text-[11px] rounded-lg transition shadow-md font-cinzel whitespace-nowrap"
              title={t('saveBtn', lang)}
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('saveBtn', lang)}</span>
            </button>

            {/* Sound Toggle Button */}
            <button
              onClick={toggleSound}
              onMouseEnter={() => soundFx.playHover()}
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white rounded-lg transition shadow-md flex items-center justify-center"
              title={isSoundEnabled ? t('muteSound', lang) : t('unmuteSound', lang)}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4 text-slate-300" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
          </div>

          {/* Resources: Diplomasi, Askeri Güç, Para */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            {/* 1. Diplomasi (Bütçe'nin eski yerinde) */}
            <div className="flex items-center space-x-1.5 bg-blue-950/60 border border-blue-700/70 px-2 py-1 rounded-lg text-blue-300 shadow-md">
              <Handshake className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <div className="font-bold text-xs leading-tight text-blue-200 whitespace-nowrap">{dipPoints.toFixed(1)} / 10</div>
                <div className="text-[8.5px] text-slate-400 whitespace-nowrap">{t('diplomacy', lang)}</div>
              </div>
            </div>

            {/* 2. Askeri Güç (Antlaşmalar'ın eski yerinde) */}
            <div className="flex items-center space-x-1.5 bg-red-950/60 border border-red-700/70 px-2 py-1 rounded-lg text-red-300 shadow-md">
              <Swords className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div>
                <div className="font-bold text-xs leading-tight text-red-200 whitespace-nowrap">{(getCountryCities(playerCode).reduce((acc, c) => acc + (troopCounts[c.id] || 0), 0) / 1000).toFixed(0)}k</div>
                <div className="text-[8.5px] text-slate-400 whitespace-nowrap">{t('militaryPower', lang)}</div>
              </div>
            </div>

            {/* 3. Para / Treasury */}
            <div 
              onClick={() => setShowBudgetModal(true)}
              className="flex items-center space-x-1.5 bg-amber-950/60 hover:bg-amber-950/90 border border-amber-600/70 px-2 py-1 rounded-lg text-amber-300 shadow-md cursor-pointer transition"
              title={lang === 'English' ? 'Click to open budget & tax details' : 'Bütçe & Vergi detaylarını açmak için tıklayın'}
            >
              <Coins className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="font-bold text-xs leading-tight text-amber-300 whitespace-nowrap">{gold.toLocaleString()} 🪙</div>
                <div className="text-[8.5px] text-emerald-400 font-semibold whitespace-nowrap">
                  +{getTotalPlayerTaxIncome().totalDaily.toLocaleString()} 🪙/{t('perDay', lang)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Map & Strategy Panel Layout */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* World Map Center */}
        <div className="flex-1 h-full relative">
          {/* Save Toast Notification */}
          <AnimatePresence>
            {showSaveToast && (
              <motion.div
                initial={{ y: -30, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -30, opacity: 0, scale: 0.9 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/95 border border-emerald-500 text-emerald-200 px-5 py-3 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center space-x-3 font-cinzel backdrop-blur-md"
              >
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-bounce" />
                <span className="font-bold text-sm">OYUN BAŞARIYLA KAYDEDİLDİ! (SLOTLAR GÜNCELLENDİ)</span>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Active Transfer Banner Indicator */}
          {transferSourceCityId && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-950/95 border border-amber-500/80 px-4 py-2.5 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center space-x-3 text-xs font-mono backdrop-blur-md"
            >
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping flex-shrink-0"></div>
              <span className="text-amber-300 font-bold">
                🚚 Şehirler arası sevk yapılıyor. Haritadan HEDEF şehir veya ülkeyi seçin!
              </span>
              <button
                onClick={() => setTransferSourceCityId(null)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition ml-1"
                title="İptal Et"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {/* Active Attack Mode Banner Indicator */}
          {isAttackMode && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-950/95 border border-red-500/80 px-4 py-2.5 rounded-full shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center space-x-3 text-xs font-mono backdrop-blur-md"
            >
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping flex-shrink-0"></div>
              <span className="text-red-300 font-bold uppercase tracking-tighter">
                ⚔️ SEFER BAŞLATILDI: Haritadan saldırılacak bir HEDEF ŞEHİR seçin!
              </span>
              <button
                onClick={() => setIsAttackMode(false)}
                className="p-1 bg-red-950 hover:bg-red-900 text-red-300 rounded-full transition ml-1 border border-red-800"
                title="İptal Et"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          <div className={`w-full h-full ${isAttackMode ? 'cursor-crosshair' : ''}`}>
            <AgeOfHistoryMap
              playerCountryCode={playerCode}
              selectedCountryCode={selectedCountryCode}
              selectedCityId={selectedCityId}
              onSelectCountry={(code) => handleSelectCountryFromMap(code)}
              onSelectCity={(cityId, code) => handleSelectCityFromMap(cityId, code)}
              mapMode={mapMode}
              conqueredCountryCodes={conqueredCountryCodes}
              conqueredCityIds={conqueredCityIds}
              alliedCountryCodes={alliedCountryCodes}
              warCountryCodes={warCountryCodes}
              troopCounts={troopCounts}
              activeMarchAnimation={activeMarchAnimation}
              activeBattleAnimation={activeBattleAnimation}
            />
          </div>
        </div>

        {/* Selected Country / Province Management Panel (Right Drawer) */}
        <div className="w-80 md:w-96 bg-slate-950/95 border-l border-slate-800 flex flex-col justify-between p-4 overflow-y-auto shadow-2xl z-20 backdrop-blur-md">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-300 tracking-wider">{t('countryProvinceManagement', lang)}</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 uppercase bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                {isOwnRegion ? t('yourRegion', lang) : isConquered ? t('annexed', lang) : isAtWar ? t('atWar', lang) : isAlly ? t('ally', lang) : t('neutral', lang)}
              </span>
            </div>

            {/* Country Flag & Basic Details */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-3 relative overflow-hidden">
              {selectedCityObj && (
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-sky-500 text-[9px] font-bold text-white rounded-bl shadow-sm uppercase tracking-tighter">
                  {t('citySelected', lang)}
                </div>
              )}
              {(() => {
                const showPlayerFlag = selectedCityObj ? (conqueredCityIds.includes(selectedCityObj.id) || isPlayerSelected || isConquered) : isPlayerSelected;
                const displayFlagUrl = showPlayerFlag ? playerCountry.flagUrl : selectedCountryObj.flagUrl;
                const displayEmoji = showPlayerFlag ? playerCountry.emoji : selectedCountryObj.emoji;
                return (
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-9 rounded border border-slate-700 overflow-hidden shadow-lg flex-shrink-0 bg-slate-950">
                      <img
                        src={displayFlagUrl}
                        alt={selectedCityObj ? selectedCityObj.name : selectedCountryObj.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                        <span>{selectedCityObj ? selectedCityObj.name : selectedCountryObj.name}</span>
                        <span>{displayEmoji}</span>
                      </h3>
                      <p className="text-xs text-amber-400">
                        {selectedCityObj 
                          ? `${selectedCityObj.isCapital ? t('capital', lang) : t('city', lang)} - ${t('defensePower', lang)}: ${selectedCityObj.defense.toLocaleString()}${showPlayerFlag ? t('yourTerritory', lang) : ''}` 
                          : `${t('capital', lang)}: ${selectedCountryObj.capital}`}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Status Tags */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-800 pt-2">
                <div className="text-slate-400">
                  {t('continent', lang)}: <strong className="text-slate-200">{translateContinent(selectedCountryObj.continent, lang)}</strong>
                </div>
                <div className="text-slate-400">
                  {t('relation', lang)}: <strong className={`${relationScore < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{relationScore}</strong>
                </div>
              </div>
            </div>

            {/* Real World Military & Stats */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2 text-xs">
              <div className="font-bold text-slate-200 flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span>{selectedCityObj ? t('cityData', lang) : t('militaryAndPopData', lang)}</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400">{selectedStats.militaryRank}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-sans-body text-[11px]">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">
                    {selectedCityObj ? t('cityPopulation', lang) : t('totalPopulation', lang)}
                  </div>
                  <strong className="text-slate-100 font-mono">
                    {selectedCityObj ? selectedCityObj.population : selectedStats.population}
                  </strong>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">
                    {selectedCityObj ? t('defensePower', lang) : t('readyTroops', lang)}
                  </div>
                  <strong className="text-red-400 font-mono">
                    {selectedCityObj ? getCityTroops(selectedCityObj.id, selectedCountryObj.code).toLocaleString() : (WORLD_COUNTRIES.find(c => c.code.toLowerCase() === selectedCountryCode.toLowerCase()) ? getCountryCities(selectedCountryCode.toLowerCase()).reduce((acc, city) => acc + getCityTroops(city.id, selectedCountryCode), 0).toLocaleString() : "45,000")}
                  </strong>
                </div>
                {selectedCityObj ? (
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 col-span-2">
                    <div className="text-slate-400 text-[10px]">
                      {t('cityType', lang)}
                    </div>
                    <strong className="text-slate-300 font-mono">
                      {selectedCityObj.isCapital ? t('capital', lang) : t('provinceCapital', lang)}
                    </strong>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-slate-400 text-[10px]">{t('reserveForce', lang)}</div>
                      <strong className="text-slate-300 font-mono">{selectedStats.reserveMilitary}</strong>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-slate-400 text-[10px]">{t('defenseBudget', lang)}</div>
                      <strong className="text-amber-300 font-mono">{selectedStats.defenseBudget}</strong>
                    </div>
                  </>
                )}
                {selectedCityObj && (
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-slate-400 text-[10px] flex items-center space-x-1">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        <span>{t('publicHappiness', lang)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-900 rounded-full h-1 border border-slate-800">
                          <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${Math.max(0, Math.min(100, 100 - getCityTaxRate(selectedCityObj.id)))}%` }}
                          ></div>
                        </div>
                        <strong className="text-emerald-400 font-mono">
                          %{Math.round(Math.max(0, Math.min(100, 100 - getCityTaxRate(selectedCityObj.id))))}
                        </strong>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-900 pt-1.5">
                      <div className="text-slate-400 text-[10px] flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span>{t('rebellionChance', lang)}</span>
                      </div>
                      <strong className="text-red-400 font-mono text-[11px]">
                        %{(() => {
                          const rate = getCityTaxRate(selectedCityObj.id);
                          return rate > 50 ? rate - 50 : 0;
                        })()}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Underground Resources - Only for Cities */}
            {selectedCityObj && isOwnRegion && (
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <div className="font-bold text-slate-200 flex items-center justify-between border-b border-slate-800 pb-1.5 text-xs">
                  <span className="flex items-center space-x-1.5">
                    <Pickaxe className="w-4 h-4 text-amber-400" />
                    <span>{t('undergroundResources', lang)}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 font-mono text-[11px]">
                  {/* Diamond */}
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300 font-bold">💎 {t('diamond', lang)}: {(cityResources[selectedCityObj.id]?.diamonds || 0).toLocaleString()} {t('grams', lang)}</span>
                    </div>
                  </div>

                  {/* Gold Ore */}
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-400 font-bold">⛏️ {t('goldOre', lang)}: {(cityResources[selectedCityObj.id]?.goldOre || 0).toLocaleString()} {t('grams', lang)}</span>
                    </div>
                  </div>

                  {/* Oil */}
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">🛢️ Petrol: {(cityResources[selectedCityObj.id]?.oil || 0).toLocaleString()} L</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grand Strategy Actions - Only for owned cities/countries */}
            {isOwnRegion ? (
              /* Player Owned / Conquered Region Actions */
              <div className="space-y-3 font-sans-body">
                {isConquered && !isPlayerSelected && (
                  <div className="p-2 bg-emerald-950/60 border border-emerald-800/80 rounded text-[11px] text-emerald-300 font-sans-body flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{t('cityConqueredNotice', lang)}</span>
                  </div>
                )}

                {/* Per-City Tax Rate Controls */}
                {selectedCityObj && (
                  <div className="p-3 bg-slate-900/90 border border-amber-600/40 rounded-lg space-y-2.5 shadow-md font-sans-body">
                    <div className="flex items-center justify-between text-xs font-cinzel border-b border-slate-800 pb-1.5">
                      <span className="font-bold text-amber-300 flex items-center space-x-1.5">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span>{selectedCityObj.name} {t('taxRateLabel', lang)}</span>
                      </span>
                      <span className="font-mono text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                        %{getCityTaxRate(selectedCityObj.id)} {t('tax', lang)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="range"
                        min="5"
                        max="80"
                        step="1"
                        value={getCityTaxRate(selectedCityObj.id)}
                        onChange={(e) => setCityTaxRate(selectedCityObj.id, Number(e.target.value))}
                        className="w-full accent-amber-500 bg-slate-950 h-2 rounded cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>%5 ({t('low', lang)})</span>
                        <span>%30 ({t('standard', lang)})</span>
                        <span>%80 ({t('high', lang)})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                      {[10, 25, 50, 80].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setCityTaxRate(selectedCityObj.id, rate)}
                          className={`py-1 rounded border transition font-bold ${
                            getCityTaxRate(selectedCityObj.id) === rate
                              ? 'bg-amber-600 text-slate-950 border-amber-500'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          %{rate}
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const { popNum, monthly, daily } = getCityTaxDetails(selectedCityObj);
                      return (
                        <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1 text-[11px] font-mono">
                          <div className="flex justify-between text-slate-400">
                            <span>{t('cityPopulation', lang)}:</span>
                            <strong className="text-slate-200">{popNum.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>{t('monthlyGain', lang)}:</span>
                            <strong className="text-emerald-400">+{monthly.toLocaleString()} 🪙</strong>
                          </div>
                          <div className="flex justify-between text-slate-300 border-t border-slate-800/80 pt-1">
                            <span>{t('dailyGain', lang)}:</span>
                            <strong className="text-amber-400">+{daily.toLocaleString()} 🪙</strong>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      onClick={() => setGlobalCityTaxRate(getCityTaxRate(selectedCityObj.id))}
                      className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded text-[10px] font-bold text-slate-300 transition font-cinzel"
                    >
                      🌐 {t('applyToAllCities', lang)} (%{getCityTaxRate(selectedCityObj.id)})
                    </button>
                  </div>
                )}

                {/* Interactive Recruitment & Troop Unit Selection */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-xs font-cinzel border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>{selectedCityObj ? `${selectedCityObj.name} - ${t('recruitTroops', lang)}` : t('recruitTroopsInRegion', lang)}</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      4 {t('unitTypes', lang)}
                    </span>
                  </div>

                  {/* Troop Unit Selection Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {TROOP_UNITS.map((unit) => {
                      const isSelected = selectedUnitType === unit.id;
                      return (
                        <button
                          key={unit.id}
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedUnitType(unit.id);
                          }}
                          className={`p-2 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                            isSelected
                              ? unit.bgActive
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base">{unit.icon}</span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-amber-300">
                              {unit.cost} 🪙/{t('unit', lang)}
                            </span>
                          </div>
                          <div className="mt-1">
                            <div className="text-xs font-bold font-cinzel line-clamp-1">{getUnitName(unit.id, lang)}</div>
                            <div className="flex items-center justify-between text-[10px] font-mono mt-0.5">
                              <span className="text-slate-400">{getUnitBadge(unit.id, lang)}</span>
                              <span className={`font-bold ${unit.color}`}>{t('power', lang)}: x{unit.powerMult}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Unit Description */}
                  {(() => {
                    const activeUnit = TROOP_UNITS.find(u => u.id === selectedUnitType) || TROOP_UNITS[0];
                    const unitName = getUnitName(activeUnit.id, lang);
                    const unitDesc = getUnitDesc(activeUnit.id, lang);
                    const totalCost = recruitSliderAmount * activeUnit.cost;
                    const powerAdded = Math.round(recruitSliderAmount * activeUnit.powerMult);
                    const canAfford = gold >= totalCost;

                    return (
                      <div className="space-y-2.5 pt-1">
                        <p className="text-[11px] text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-800/80 leading-relaxed font-sans-body">
                          {activeUnit.icon} <strong className="text-slate-200">{unitName}:</strong> {unitDesc}
                        </p>

                        <div className="flex items-center justify-between text-xs font-cinzel">
                          <span className="text-slate-300 font-bold">{t('amount', lang)}:</span>
                          <span className="font-mono text-amber-300 font-bold text-sm">
                            +{recruitSliderAmount.toLocaleString()} {t('troops', lang)}
                          </span>
                        </div>

                        <input
                          type="range"
                          min="1"
                          max="100000"
                          step="1"
                          value={recruitSliderAmount}
                          onChange={(e) => setRecruitSliderAmount(Math.min(100000, Math.max(1, Number(e.target.value))))}
                          className="w-full accent-emerald-500 bg-slate-950 h-2 rounded cursor-pointer"
                        />

                        {/* Quick step adjustment buttons */}
                        <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
                          <button
                            onClick={() => setRecruitSliderAmount((prev) => Math.min(100000, Math.max(1, prev - 1)))}
                            className="py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 font-bold"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => setRecruitSliderAmount((prev) => Math.min(100000, Math.max(1, prev + 1)))}
                            className="py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 font-bold"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => setRecruitSliderAmount((prev) => Math.min(100000, Math.max(1, prev + 100)))}
                            className="py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 font-bold"
                          >
                            +100
                          </button>
                          <button
                            onClick={() => setRecruitSliderAmount((prev) => Math.min(100000, Math.max(1, prev + 1000)))}
                            className="py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 font-bold"
                          >
                            +1k
                          </button>
                          <button
                            onClick={() => setRecruitSliderAmount(() => Math.min(100000, Math.max(1, Math.floor(gold / activeUnit.cost))))}
                            className="py-0.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 rounded text-amber-300 font-bold"
                          >
                            Max
                          </button>
                        </div>

                        {/* Total Cost, Power Output & Training Time Summary */}
                        {(() => {
                          const trainSeconds = Math.max(2, Math.round((recruitSliderAmount / 1000) * activeUnit.trainTimePer1k));
                          return (
                            <>
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-[11px] font-mono">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">{t('totalCost', lang)}:</span>
                                  <span className={`font-bold ${canAfford ? 'text-amber-400' : 'text-red-400'}`}>
                                    {totalCost.toLocaleString()} 🪙
                                  </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                                  <span className="text-slate-400">{t('armyPowerAdded', lang)}:</span>
                                  <span className="font-bold text-emerald-400 flex items-center space-x-1">
                                    <span>+{powerAdded.toLocaleString()}</span>
                                    <span className="text-[9px] text-slate-500">(x{activeUnit.powerMult})</span>
                                  </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                                  <span className="text-slate-400">{t('estTrainingTime', lang)}:</span>
                                  <span className="font-bold text-cyan-400 flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-cyan-400 inline" />
                                    <span>{trainSeconds} {t('seconds', lang)}</span>
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={handleRecruitCustomTroops}
                                disabled={!canAfford || recruitSliderAmount < 1}
                                className="w-full py-2.5 px-3 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-800 rounded-lg flex items-center justify-center space-x-2 text-xs font-bold text-emerald-200 transition disabled:opacity-50 font-cinzel shadow-md cursor-pointer"
                              >
                                <Swords className="w-4 h-4 text-emerald-400" />
                                <span>{unitName} {t('startTraining', lang)} ({trainSeconds} {t('seconds', lang)})</span>
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>

                {/* Send / Transfer Troops to Another Country/City */}
                <button
                  onClick={handleStartTransferMode}
                  className={`w-full py-2.5 px-3 border rounded flex items-center justify-between text-xs font-bold transition shadow-md group font-cinzel ${
                    transferSourceCityId === (selectedCityId || selectedCountryCode)
                      ? 'bg-cyan-600 border-cyan-400 text-white animate-pulse'
                      : 'bg-blue-950/90 hover:bg-blue-900 border-blue-800 text-blue-200'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <Send className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    <span>{transferSourceCityId === (selectedCityId || selectedCountryCode) ? t('selectDestination', lang) : t('transferTroopsBtn', lang)}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Launch Campaign / Attack Button */}
                <button
                  onClick={handleStartAttackMode}
                  className={`w-full py-2.5 px-3 border rounded flex items-center justify-between text-xs font-bold transition shadow-md group font-cinzel ${
                    isAttackMode 
                      ? 'bg-red-600 border-red-400 text-white animate-pulse' 
                      : 'bg-red-950/90 hover:bg-red-900 border-red-800 text-red-200'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <Swords className={`w-4 h-4 ${isAttackMode ? 'text-white' : 'text-red-500'}`} />
                    <span>{isAttackMode ? t('selectAttackTarget', lang) : t('launchCampaignBtn', lang)}</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 ${isAttackMode ? 'text-white' : 'text-slate-400'}`} />
                </button>


              </div>
            ) : (
                /* Foreign / Enemy Country Actions */
                <div className="space-y-2">
                  {/* War Button */}
                  <button
                    onClick={isAtWar ? undefined : handleDeclareWar}
                    className={`w-full py-2.5 px-3 rounded flex items-center justify-center space-x-2 text-xs font-bold transition ${
                      isAtWar 
                        ? 'bg-red-900/40 border border-red-800/50 text-red-500 cursor-default shadow-inner' 
                        : 'bg-red-950 hover:bg-red-900 border border-red-800 text-red-300'
                    }`}
                  >
                    {isAtWar ? <Skull className="w-4 h-4" /> : <Swords className="w-4 h-4 text-red-500" />}
                    <span>{isAtWar ? t('enemy', lang) : t('declareWar', lang)}</span>
                  </button>

                  {/* Diplomacy Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleImproveRelations}
                      disabled={gold < 15000}
                      className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] font-bold text-slate-200 flex flex-col items-center justify-center space-y-1 transition disabled:opacity-50"
                    >
                      <Handshake className="w-4 h-4 text-cyan-400" />
                      <span>{t('improveRelations', lang)}</span>
                      <span className="text-[9px] font-mono text-amber-400">-15,000 🪙</span>
                    </button>

                    <button
                      onClick={handleFormAlliance}
                      disabled={isAlly || relationScore < 50}
                      className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] font-bold text-slate-200 flex flex-col items-center justify-center space-y-1 transition disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>{isAlly ? t('ally', lang) : t('formAlliance', lang)}</span>
                      <span className="text-[9px] text-slate-400">{t('reqRelation50', lang)}</span>
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setTradeAmount(0);
                        setShowTradeModal(selectedCountryCode);
                      }}
                      disabled={isAtWar || relationScore < 0 || !(signedTreaties[selectedCountryCode]?.trade)}
                      className="col-span-2 py-2 px-2 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/50 rounded text-[11px] font-bold text-amber-300 flex flex-col items-center justify-center space-y-1 transition disabled:opacity-50"
                    >
                      <Pickaxe className="w-4 h-4 text-amber-500" />
                      <span>{t('resourceTradeTreaty', lang)}</span>
                      {relationScore < 0 && <span className="text-[9px] text-slate-400">{t('badRelations', lang)}</span>}
                      {relationScore >= 0 && !(signedTreaties[selectedCountryCode]?.trade) && <span className="text-[9px] text-slate-400">{t('tradePactReq', lang)}</span>}
                    </button>
                  </div>

                  {/* Important Cities & City Conquest Panel */}
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400 font-cinzel">
                      <span>{t('importantCitiesTargets', lang)}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({getCountryCities(selectedCountryCode).filter((c) => conqueredCityIds.includes(c.id)).length} / {getCountryCities(selectedCountryCode).length} {t('conqueredCount', lang)})
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {getCountryCities(selectedCountryCode).map((city) => {
                        const isCityConquered = conqueredCityIds.includes(city.id) || isConquered;
                        return (
                          <div key={city.id} className="p-2 bg-slate-900 border border-slate-800 rounded flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-100 flex items-center space-x-1">
                                <span>{city.name}</span>
                                {city.isCapital && <span className="text-amber-400 text-[10px]">⭐</span>}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{t('population', lang)}: {city.population} • {t('troops', lang)}: {getCityTroops(city.id, city.countryCode).toLocaleString()} ({t('defense', lang)}: {city.defense.toLocaleString()})</div>
                            </div>
                            <div>
                              {isCityConquered ? (
                                <span className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold font-cinzel flex items-center space-x-1">
                                  <span>✓ {t('conquered', lang)}</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleConquerCity(city)}
                                  disabled={!isAtWar}
                                  className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 rounded text-[10px] font-bold font-cinzel transition disabled:opacity-40"
                                >
                                  {t('siegeAndConquer', lang)}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!isAtWar && (
                      <div className="text-[10px] text-amber-500 italic text-center">
                        * {t('declareWarNotice', lang)}
                      </div>
                    )}
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>

      {/* Bottom Age of History Event Ticker Bar */}
      <div 
        onClick={() => {
          soundFx.playClick();
          setShowLogsModal(true);
        }}
        className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs z-30 font-mono cursor-pointer hover:bg-slate-900/60 transition"
      >
        <div className="flex items-center space-x-2 text-amber-500 font-bold font-cinzel">
          <Sparkles className="w-4 h-4" />
          <span>{t('campaignLog', lang)}:</span>
        </div>
        <div className="flex-1 px-4 overflow-hidden">
          <div className="text-slate-300 truncate">{formatLog(logs[0], lang)}</div>
        </div>
        <div className="text-[10px] text-slate-500 font-sans-body hidden sm:block">
          Age of History Grand Strategy Engine • 2026
        </div>
      </div>

      {/* Troop Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && transferSourceCityId && transferTargetCityId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-cinzel"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-2xl space-y-5 relative overflow-hidden"
            >
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferSourceCityId(null);
                  setTransferTargetCityId(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Send className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-slate-100">{t('organizeTroopShipment', lang)}</h3>
              </div>

              {/* Source vs Target City Cards */}
              {(() => {
                const allCities = WORLD_COUNTRIES.flatMap(c => getCountryCities(c.code.toLowerCase()));
                const sourceCity = allCities.find(c => c.id === transferSourceCityId);
                const targetCity = allCities.find(c => c.id === transferTargetCityId);
                
                if (!sourceCity || !targetCity) return null;

                const isTargetOwned = conqueredCityIds.includes(transferTargetCityId) || 
                                     WORLD_COUNTRIES.find(c => getCountryCities(c.code.toLowerCase()).some(city => city.id === transferTargetCityId))?.code.toLowerCase() === playerCode;

                const sourceTroops = troopCounts[transferSourceCityId] || 0;
                const maxTransfer = Math.max(100, sourceTroops - 100);

                return (
                  <div className="space-y-4 font-sans-body">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Source */}
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-center">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{t('pointOfDeparture', lang)}</div>
                        <div className="w-10 h-10 flex items-center justify-center text-xl mx-auto bg-slate-800 rounded-full border border-slate-700">🏙️</div>
                        <div className="font-bold text-slate-100 font-cinzel">{sourceCity.name}</div>
                        <div className="text-[11px] text-amber-400 font-mono">{sourceTroops.toLocaleString()} {t('soldiers', lang)}</div>
                      </div>

                      {/* Target */}
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-center">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{t('destinationRegion', lang)}</div>
                        <div className="w-10 h-10 flex items-center justify-center text-xl mx-auto bg-slate-800 rounded-full border border-slate-700">🎯</div>
                        <div className="font-bold text-slate-100 font-cinzel">{targetCity.name}</div>
                        <div className="text-[10px] font-mono text-emerald-400">
                          {isTargetOwned ? `✓ ${t('yourCity', lang)}` : `⚔️ ${t('enemyCity', lang)}`}
                        </div>
                      </div>
                    </div>

                    {/* Troop Amount Slider */}
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                        <span>{t('troopsToSend', lang)}</span>
                        <span className="text-cyan-400 font-mono text-sm">{transferAmount.toLocaleString()} {t('units', lang)}</span>
                      </div>

                      <input
                        type="range"
                        min="100"
                        max={maxTransfer}
                        step="100"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(Number(e.target.value))}
                        className="w-full accent-cyan-500 bg-slate-950 h-2 rounded cursor-pointer"
                      />

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-slate-400">
                        <div>
                          {t('remainingAtSource', lang)}: <strong className="text-slate-200">{(sourceTroops - transferAmount).toLocaleString()}</strong>
                        </div>
                        <div>
                          {t('shipped', lang)}: <strong className="text-cyan-400">{transferAmount.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmTransfer}
                      className={`w-full py-3 px-4 font-bold text-xs rounded transition shadow-lg font-cinzel flex items-center justify-center space-x-2 ${
                        isTargetOwned
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50'
                      }`}
                    >
                      {isTargetOwned ? (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{t('shipTroopsToProvince', lang)}</span>
                        </>
                      ) : (
                        <>
                          <Swords className="w-4 h-4" />
                          <span>{t('startAttackAndShip', lang)}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBudgetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-cinzel"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-slate-950 border border-amber-600/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-5 relative max-h-[90vh] flex flex-col overflow-hidden"
            >
              <button
                onClick={() => setShowBudgetModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <Sliders className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{t('budgetAndTaxManagement', lang)}</h3>
                  <p className="text-xs text-slate-400 font-sans-body">
                    {t('taxFormulaNotice', lang)}
                  </p>
                </div>
              </div>

              {/* Top Summary Metrics */}
              {(() => {
                const { totalMonthly, totalDaily, cityCount, cities } = getTotalPlayerTaxIncome();
                return (
                  <div className="space-y-4 font-sans-body overflow-y-auto pr-1 flex-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">{t('managedCities', lang)}</div>
                        <div className="text-base font-bold text-amber-300 font-mono mt-0.5">{cityCount} {t('citiesCount', lang)}</div>
                      </div>

                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">{t('totalTreasury', lang)}</div>
                        <div className="text-base font-bold text-amber-400 font-mono mt-0.5">{gold.toLocaleString()} 🪙</div>
                      </div>

                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">{t('monthlyTaxIncome', lang)}</div>
                        <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">+{totalMonthly.toLocaleString()} 🪙</div>
                      </div>

                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">{t('dailyTaxIncome', lang)}</div>
                        <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">+{totalDaily.toLocaleString()} 🪙</div>
                      </div>
                    </div>

                    {/* Global Tax Rate Control */}
                    <div className="p-3.5 bg-slate-900/90 border border-amber-500/30 rounded-xl space-y-2 font-mono">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-300 font-cinzel">🌐 {t('globalTaxRate', lang)}</span>
                        <span className="text-amber-400 font-bold font-mono">%{taxRate}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="5"
                          max="80"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          className="w-full accent-amber-500 bg-slate-950 h-2 rounded cursor-pointer"
                        />
                        <button
                          onClick={() => setGlobalCityTaxRate(taxRate)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] rounded whitespace-nowrap font-cinzel shadow"
                        >
                          {t('applyToAll', lang)}
                        </button>
                      </div>
                    </div>

                    {/* Timer Note & Manual Advance */}
                    <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-amber-200 gap-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
                        <span>{t('autoDayProgress', lang)} (+{totalDaily.toLocaleString()} 🪙)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="font-bold bg-amber-900/80 px-2 py-0.5 rounded border border-amber-700 text-center">
                          {Math.floor(dayTimerSeconds / 60).toString().padStart(2, '0')}:{(dayTimerSeconds % 60).toString().padStart(2, '0')}
                        </div>
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            handleNextTurn();
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-500/50 hover:border-amber-400 rounded text-[10px] text-amber-400 hover:text-amber-300 font-mono shadow-inner transition cursor-pointer"
                        >
                          {t('advance1DayNow', lang)}
                        </button>
                      </div>
                    </div>

                    {/* Scrollable City List */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-300 font-cinzel flex items-center justify-between">
                        <span>{t('cityTaxRatesAndIncomes', lang)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({cities.length} {t('citiesListed', lang)})</span>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {cities.map((c) => {
                          const { popNum, rate, monthly, daily } = getCityTaxDetails(c);
                          const rebelChance = rate > 50 ? rate - 50 : 0;
                          const res = cityResources[c.id] || { diamonds: 0, goldOre: 0, oil: 0 };

                          return (
                            <div key={c.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-2 relative">
                              {/* Top Row: Info & Tax */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                                <div className="flex items-center space-x-2">
                                  <span className="text-base">{c.isCapital ? '👑' : '🏙️'}</span>
                                  <div>
                                    <div className="font-bold text-slate-100 font-cinzel">{c.name}</div>
                                    <div className="text-[10px] text-slate-400">{t('population', lang)}: {c.population} ({popNum.toLocaleString()})</div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center space-x-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                      <span className="text-slate-400 text-[10px]">{t('tax', lang)}:</span>
                                      <input
                                        type="range"
                                        min="5"
                                        max="80"
                                        value={rate}
                                        onChange={(e) => setCityTaxRate(c.id, Number(e.target.value))}
                                        className="w-16 sm:w-20 accent-amber-500 cursor-pointer"
                                      />
                                      <span className={`font-bold text-xs w-8 text-right ${rate > 50 ? 'text-red-400' : 'text-amber-400'}`}>%{rate}</span>
                                    </div>
                                    <div className={`text-[9px] mt-0.5 ${rebelChance > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                                      {rebelChance > 0 ? '⚠️' : '✅'} {t('rebellionChance', lang)}: %{rebelChance}
                                    </div>
                                  </div>

                                  <div className="text-right text-[11px]">
                                    <div className="text-emerald-400 font-bold">+{monthly.toLocaleString()} 🪙/{t('monthShort', lang)}</div>
                                    <div className="text-[9.5px] text-amber-400">+{daily.toLocaleString()} 🪙/{t('dayShort', lang)}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Row: Underground Resources */}
                              <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 text-[10px] font-mono">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-blue-300 font-bold">💎 {t('diamond', lang)}:</span>
                                    <span className="text-slate-300">{res.diamonds.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-amber-400 font-bold">⛏️ {t('goldOre', lang)}:</span>
                                    <span className="text-slate-300">{res.goldOre.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-slate-500 font-bold">🛢️ {t('oil', lang)}:</span>
                                    <span className="text-slate-300">{res.oil.toLocaleString()} L</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={() => {
                  soundFx.playSuccess();
                  setShowBudgetModal(false);
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded transition font-cinzel shadow"
              >
                {t('confirmAndCloseBudget', lang)}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Clash Result Modal */}
      <AnimatePresence>
        {battleState?.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-cinzel"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="w-full max-w-lg bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-2xl space-y-6 text-center relative overflow-hidden"
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-amber-500 tracking-widest uppercase flex items-center justify-center space-x-1.5">
                  <Swords className="w-4 h-4 text-red-500" />
                  <span>{t('frontlineBattle', lang)}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-100">
                  {battleState.winner === 'player' ? `🏆 ${t('victoriousVictory', lang)}` : `⚠️ ${t('battleDefeat', lang)}`}
                </h2>
              </div>

              {/* Clash Animation Cards */}
              <div className="grid grid-cols-2 gap-4 items-center">
                {/* Player side */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <img
                    src={playerCountry.flagUrl}
                    alt={playerCountry.name}
                    className="w-12 h-8 rounded mx-auto border border-slate-700 object-cover"
                  />
                  <div className="text-sm font-bold text-slate-100">{playerCountry.name}</div>
                  <div className="text-xs text-red-400 font-mono">{t('loss', lang)}: -{battleState.playerLosses.toLocaleString()}</div>
                </div>

                {/* Target side */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  {battleState.targetCountry && (
                    <img
                      src={battleState.targetCountry.flagUrl}
                      alt={battleState.targetCountry.name}
                      className="w-12 h-8 rounded mx-auto border border-slate-700 object-cover"
                    />
                  )}
                  <div className="text-sm font-bold text-slate-100">{battleState.targetCountry?.name}</div>
                  <div className="text-xs text-red-400 font-mono">{t('loss', lang)}: -{battleState.targetLosses.toLocaleString()}</div>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-sans-body leading-relaxed">
                {battleState.winner === 'player'
                  ? `${t('victoriousBattleDesc', lang)} (${battleState.targetCountry?.name}).`
                  : `${t('defeatedBattleDesc', lang)} (${battleState.targetCountry?.name}).`}
              </p>

              <button
                onClick={() => setBattleState(null)}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded transition shadow-lg"
              >
                {t('returnFromFront', lang)}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Treaty & Diplomacy Modal */}
      <AnimatePresence>
        {showTreatyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-cinzel"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-3xl bg-slate-950 border border-emerald-900/80 p-6 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] space-y-6 relative overflow-hidden"
            >
              <button
                onClick={() => setShowTreatyModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <Scroll className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{t('intlTreatiesAndDiplomacy', lang)}</h3>
                  <p className="text-xs text-slate-400 font-sans-body">
                    {t('managePactsAndTradesDesc', lang)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans-body">
                {/* Left: Country List */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 flex flex-col max-h-96">
                  <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest px-1 font-bold">
                    {t('worldNations', lang)} ({WORLD_COUNTRIES.length})
                  </div>
                  <input
                    type="text"
                    placeholder={t('searchCountryPlaceholder', lang)}
                    value={treatySearchQuery}
                    onChange={(e) => setTreatySearchQuery(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-700"
                  />
                  <div className="overflow-y-auto space-y-1 pr-1 flex-1">
                    {WORLD_COUNTRIES
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
                      .filter((c) => c.name.toLowerCase().includes(treatySearchQuery.toLowerCase()))
                      .map((c) => {
                        const isSelected = c.code.toLowerCase() === selectedTreatyCountryCode;
                        const isPlayer = c.code.toLowerCase() === playerCode;
                        if (isPlayer) return null;
                        return (
                          <button
                            key={c.code}
                            onClick={() => {
                              soundFx.playClick();
                              setSelectedTreatyCountryCode(c.code.toLowerCase());
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-3 transition text-xs font-bold ${
                              isSelected
                                ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-200 shadow'
                                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-transparent'
                            }`}
                          >
                            <img src={c.flagUrl} alt={c.name} className="w-6 h-4 rounded object-cover flex-shrink-0 border border-slate-700" />
                            <span className="truncate flex-1">{c.name}</span>
                            {conqueredCountryCodes.includes(c.code.toLowerCase()) && (
                              <span className="text-[10px] text-emerald-400 font-mono">{t('annexed', lang)}</span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Right: Selected Country Treaty Management */}
                <div className="md:col-span-2 space-y-4">
                  {(() => {
                    const targetObj = WORLD_COUNTRIES.find((c) => c.code.toLowerCase() === selectedTreatyCountryCode) || WORLD_COUNTRIES[0];
                    const treaties = signedTreaties[selectedTreatyCountryCode] || {
                      pact: false,
                      trade: false,
                      alliance: false,
                      peace: false,
                      reparations: false,
                    };

                    return (
                      <div className="space-y-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                        {/* Header card */}
                        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                          <img src={targetObj.flagUrl} alt={targetObj.name} className="w-12 h-8 rounded object-cover border border-slate-700 shadow" />
                          <div>
                            <div className="text-base font-bold text-slate-100 font-cinzel">{targetObj.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{t('capitalDiplomaticStatus', lang)}</div>
                          </div>
                        </div>

                        {/* Treaties Options */}
                        <div className="space-y-3">
                          {/* 1. Saldırmazlık Paktı */}
                          <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                            <div>
                              <div className="text-xs font-bold text-slate-200 font-cinzel flex items-center space-x-1.5">
                                <Shield className="w-4 h-4 text-cyan-400" />
                                <span>{t('nonAggressionPact', lang)}</span>
                              </div>
                              <div className="text-[11px] text-slate-400">{t('nonAggressionPactDesc', lang)} {t('cost', lang)}: {getPactCost(targetObj.code).toLocaleString()} 🪙</div>
                            </div>
                            <button
                              onClick={() => handleSignTreaty(targetObj.code, 'pact')}
                              disabled={!treaties.pact && gold < getPactCost(targetObj.code)}
                              className={`px-3 py-1.5 rounded text-xs font-bold font-cinzel transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                treaties.pact
                                  ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                              }`}
                            >
                              {treaties.pact ? `✓ ${t('signed', lang)}` : `${t('sign', lang)} (-${Math.floor(getPactCost(targetObj.code) / 1000)}k 🪙)`}
                            </button>
                          </div>

                          {/* 2. Ticaret Anlaşması */}
                          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold text-slate-200 font-cinzel flex items-center space-x-1.5">
                                  <Coins className="w-4 h-4 text-amber-400" />
                                  <span>{t('tradePact', lang)}</span>
                                </div>
                                <div className="text-[11px] text-slate-400">{t('tradePactDesc', lang)} {t('cost', lang)}: {Math.floor(50000 * getEconomyMultiplier(targetObj.code)).toLocaleString()} 🪙</div>
                              </div>
                              <button
                                onClick={() => handleSignTreaty(targetObj.code, 'trade')}
                                disabled={!treaties.trade && gold < Math.floor(50000 * getEconomyMultiplier(targetObj.code))}
                                className={`px-3 py-1.5 rounded text-xs font-bold font-cinzel transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                  treaties.trade
                                    ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                }`}
                              >
                                {treaties.trade ? `✓ ${t('signed', lang)}` : `${t('sign', lang)} (-${Math.floor(50000 * getEconomyMultiplier(targetObj.code) / 1000)}k 🪙)`}
                              </button>
                            </div>

                            {/* Alım Fiyatları Bilgisi */}
                            {(() => {
                              const mult = getEconomyMultiplier(targetObj.code);
                              return (
                                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                                  <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-slate-400 font-sans-body">{t('countryPurchasePrices', lang)}:</span>
                                    <div className="flex items-center space-x-2 text-[10px]">
                                      <span className="text-amber-300">⛏️ 1g {t('goldOre', lang)}: <strong>{Math.floor(300 * mult).toLocaleString()} 🪙</strong></span>
                                      <span className="text-cyan-300">💎 1g {t('diamond', lang)}: <strong>{Math.floor(500 * mult).toLocaleString()} 🪙</strong></span>
                                      <span className="text-amber-400">🛢️ 1L {t('oil', lang)}: <strong>{Math.floor(1000 * mult).toLocaleString()} 🪙</strong></span>
                                    </div>
                                  </div>

                                  {treaties.trade && (
                                    <button
                                      onClick={() => {
                                        setShowTreatyModal(false);
                                        setShowTradeModal(targetObj.code.toLowerCase());
                                        setTradeResourceType('diamonds');
                                        setTradeAmount(0);
                                      }}
                                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition flex items-center justify-center space-x-1.5 shadow font-cinzel cursor-pointer"
                                    >
                                      <Coins className="w-3.5 h-3.5" />
                                      <span>{t('sellResourcesExport', lang)}</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowTreatyModal(false)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded transition font-cinzel shadow"
                >
                  {t('closeDiplomacyCenter', lang)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Fullscreen Empire Management Menu */}
      <AnimatePresence>
        {isPlayerMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#030712] text-slate-100 flex font-cinzel overflow-hidden"
          >
            {/* LEFT SIDEBAR: Navigation */}
            <div className="w-20 md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-6 space-y-8 flex-shrink-0 shadow-2xl relative z-10">
              <div className="flex flex-col items-center space-y-2 mb-4 group px-4">
                <div className="relative">
                  <img src={playerCountry.flagUrl} alt={playerCountry.name} className="w-12 h-8 md:w-16 md:h-10 rounded border border-slate-700 object-cover shadow-lg transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-amber-500/10 rounded pointer-events-none"></div>
                </div>
                <div className="hidden md:block text-center">
                  <h2 className="text-[10px] font-extrabold text-amber-500 tracking-[0.2em] leading-tight uppercase">{playerCountry.name}</h2>
                  <p className="text-[8px] text-slate-500 font-mono mt-0.5">{heroName}</p>
                </div>
              </div>

              <div className="flex-1 w-full px-2 space-y-2">
                <button
                  onClick={() => { soundFx.playClick(); setPlayerMenuTab('manager'); }}
                  className={`w-full flex flex-col md:flex-row items-center md:space-x-3 px-3 py-4 md:py-3 rounded-xl transition-all duration-300 group ${
                    playerMenuTab === 'manager' ? 'bg-amber-600 text-slate-950 shadow-[0_0_20px_rgba(217,119,6,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Crown className={`w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:scale-110 ${playerMenuTab === 'manager' ? 'text-slate-950' : 'text-amber-500'}`} />
                  <span className="hidden md:block text-[11px] font-bold tracking-wider uppercase">{t('cityManager', lang)}</span>
                </button>

                <button
                  onClick={() => { soundFx.playClick(); setPlayerMenuTab('conquered'); }}
                  className={`w-full flex flex-col md:flex-row items-center md:space-x-3 px-3 py-4 md:py-3 rounded-xl transition-all duration-300 group ${
                    playerMenuTab === 'conquered' ? 'bg-emerald-600 text-slate-950 shadow-[0_0_20px_rgba(5,150,105,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Globe className={`w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:scale-110 ${playerMenuTab === 'conquered' ? 'text-slate-950' : 'text-emerald-500'}`} />
                  <span className="hidden md:block text-[11px] font-bold tracking-wider uppercase">{t('conqueredNations', lang)}</span>
                </button>

                <button
                  onClick={() => { soundFx.playClick(); setPlayerMenuTab('enemies'); }}
                  className={`w-full flex flex-col md:flex-row items-center md:space-x-3 px-3 py-4 md:py-3 rounded-xl transition-all duration-300 group ${
                    playerMenuTab === 'enemies' ? 'bg-red-600 text-slate-950 shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Swords className={`w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:scale-110 ${playerMenuTab === 'enemies' ? 'text-slate-950' : 'text-red-500'}`} />
                  <span className="hidden md:block text-[11px] font-bold tracking-wider uppercase">{t('enemyNations', lang)}</span>
                </button>

                <button
                  onClick={() => { soundFx.playClick(); setPlayerMenuTab('treaties'); }}
                  className={`w-full flex flex-col md:flex-row items-center md:space-x-3 px-3 py-4 md:py-3 rounded-xl transition-all duration-300 group ${
                    playerMenuTab === 'treaties' ? 'bg-cyan-600 text-slate-950 shadow-[0_0_20px_rgba(8,145,178,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Scroll className={`w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:scale-110 ${playerMenuTab === 'treaties' ? 'text-slate-950' : 'text-cyan-500'}`} />
                  <span className="hidden md:block text-[11px] font-bold tracking-wider uppercase">{t('diplomacyAndPacts', lang)}</span>
                </button>
              </div>

              <div className="w-full px-2 mt-auto pb-4">
                <button
                  onClick={() => { soundFx.playClick(); setIsPlayerMenuOpen(false); }}
                  className="w-full flex flex-col md:flex-row items-center md:space-x-3 px-3 py-4 md:py-3 rounded-xl bg-slate-900 text-slate-400 hover:bg-red-950 hover:text-white hover:border-red-600/50 border border-slate-800 transition-all duration-300 group"
                >
                  <X className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:rotate-90" />
                  <span className="hidden md:block text-[11px] font-bold tracking-wider uppercase">{t('close', lang)}</span>
                </button>
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#050811] relative">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none"></div>

              {playerMenuTab === 'manager' && (
                <div className="flex h-full overflow-hidden">
                  {/* City List Sidebar (within Content) */}
                  <div className="w-64 md:w-80 bg-slate-900/50 border-r border-slate-800/80 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/30">
                      <h3 className="text-xs font-bold text-amber-500 tracking-widest uppercase">{t('provinceCityList', lang)}</h3>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder={t('searchCityPlaceholder', lang)}
                          value={playerMenuSearch}
                          onChange={(e) => setPlayerMenuSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-600 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {getAllPlayerCities()
                        .filter(c => c.name.toLowerCase().includes(playerMenuSearch.toLowerCase()))
                        .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
                        .map((city) => {
                          const isSelected = menuSelectedCityId === city.id;
                          const troops = troopCounts[city.id] || 0;
                          return (
                            <button
                              key={city.id}
                              onClick={() => { soundFx.playClick(); setMenuSelectedCityId(city.id); }}
                              className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-300 flex items-center justify-between group ${
                                isSelected
                                  ? 'bg-amber-600/20 border border-amber-600/50 text-amber-200'
                                  : 'hover:bg-slate-800/50 border border-transparent text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold tracking-tight">{city.name}</span>
                                <span className="text-[9px] font-mono opacity-60 flex items-center space-x-1">
                                  <Users className="w-2.5 h-2.5" />
                                  <span>{troops.toLocaleString()}</span>
                                </span>
                              </div>
                              {city.isCapital && (
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                              )}
                              <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90 text-amber-400' : 'opacity-0 group-hover:opacity-100'}`} />
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* City Details Panel */}
                  <div className="flex-1 overflow-y-auto p-8 relative">
                    {menuSelectedCityId ? (
                      (() => {
                        const city = ALL_CITIES.find(c => c.id === menuSelectedCityId);
                        if (!city) return null;
                        const troops = troopCounts[city.id] || 0;
                        const popNum = parsePopulationNumber(city.population);
                        const cityRate = getCityTaxRate(city.id);
                        const monthlyTax = calculateCityMonthlyTax(popNum, cityRate);
                        const dailyTax = calculateCityDailyTax(popNum, cityRate);
                        
                        const getCityType = () => {
                          if (city.isCapital) return t('capital', lang);
                          if (popNum > 5000000) return t('metropolis', lang);
                          if (popNum > 1000000) return t('majorCity', lang);
                          return t('city', lang);
                        };

                        const getCityResources = () => {
                          const res = cityResources[city.id] || { diamonds: 0, goldOre: 0, oil: 0 };
                          
                          return (
                            <div className="grid grid-cols-3 gap-2 w-full">
                              <div className="flex flex-col items-center p-2 bg-slate-950/40 rounded-lg border border-slate-800/40">
                                <Gem className="w-3.5 h-3.5 text-cyan-400 mb-1" />
                                <span className="text-[9px] text-slate-500 uppercase font-bold">{t('diamonds', lang)}</span>
                                <span className="text-[11px] font-mono font-bold text-cyan-100">{res.diamonds.toLocaleString()} gr</span>
                              </div>
                              <div className="flex flex-col items-center p-2 bg-slate-950/40 rounded-lg border border-slate-800/40">
                                <Coins className="w-3.5 h-3.5 text-amber-500 mb-1" />
                                <span className="text-[9px] text-slate-500 uppercase font-bold">{t('goldLabel', lang)}</span>
                                <span className="text-[11px] font-mono font-bold text-amber-100">{res.goldOre.toLocaleString()} gr</span>
                              </div>
                              <div className="flex flex-col items-center p-2 bg-slate-950/40 rounded-lg border border-slate-800/40">
                                <Pickaxe className="w-3.5 h-3.5 text-slate-400 mb-1" />
                                <span className="text-[9px] text-slate-500 uppercase font-bold">{t('oil', lang)}</span>
                                <span className="text-[11px] font-mono font-bold text-slate-100">{res.oil.toLocaleString()} L</span>
                              </div>
                            </div>
                          );
                        };

                        const happiness = Math.max(0, Math.min(100, 100 - cityRate));

                        return (
                          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Header Section */}
                            <div className="flex items-end justify-between border-b border-slate-800 pb-6">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-3">
                                  <h2 className="text-3xl font-extrabold text-white tracking-tight">{city.name.toUpperCase()}</h2>
                                  {city.isCapital && <span className="px-3 py-1 bg-amber-600 text-slate-950 text-[10px] font-bold rounded-full tracking-widest uppercase">{t('capital', lang)}</span>}
                                </div>
                                <p className="text-sm text-slate-400 font-sans-body uppercase tracking-wider text-[10px]">{t('empireCityData', lang)} / {getCityType()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">{t('monthlyGain', lang)}</p>
                                <p className="text-2xl font-mono text-emerald-400 font-bold">+{monthlyTax.toLocaleString()} 🪙</p>
                              </div>
                            </div>

                            {/* Stats Grid - Main Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-inner group hover:bg-slate-800/80 transition-colors">
                                <Users className="w-6 h-6 text-blue-400 mb-1" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('population', lang)}</span>
                                <span className="text-lg font-mono font-bold text-white">{city.population}</span>
                              </div>
                              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-inner group hover:bg-slate-800/80 transition-colors">
                                <Shield className="w-6 h-6 text-red-500 mb-1" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('defensePower', lang)}</span>
                                <span className="text-lg font-mono font-bold text-white">{(troops).toLocaleString()}</span>
                              </div>
                              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-inner text-center group hover:bg-slate-800/80 transition-colors">
                                <MapPin className="w-6 h-6 text-amber-500 mb-1" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('cityType', lang)}</span>
                                <span className="text-[11px] font-bold text-amber-200 uppercase leading-tight">{getCityType()}</span>
                              </div>
                            </div>

                            {/* Detailed Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl space-y-4">
                                <div className="flex items-center space-x-2 text-slate-400 pb-2 border-b border-slate-800/50">
                                  <Gem className="w-4 h-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('undergroundResources', lang)}</span>
                                </div>
                                {getCityResources()}
                              </div>
                              <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl space-y-4">
                                <div className="flex items-center space-x-2 text-slate-400 pb-2 border-b border-slate-800/50">
                                  <Activity className="w-4 h-4 text-emerald-500" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('publicHappiness', lang)}</span>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-end">
                                    <span className="text-2xl font-mono font-bold text-emerald-400">%{Math.round(happiness)}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{t('taxEffectIncluded', lang)}</span>
                                  </div>
                                  <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800">
                                    <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${happiness}%` }}></div>
                                  </div>
                                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-800/40">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center space-x-1">
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                      <span>{t('rebellionChance', lang)}</span>
                                    </span>
                                    <span className="text-sm font-mono font-bold text-red-400">%{cityRate > 50 ? cityRate - 50 : 0}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl space-y-4">
                                <div className="flex items-center space-x-2 text-slate-400 pb-2 border-b border-slate-800/50">
                                  <Wallet className="w-4 h-4 text-amber-500" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('financialData', lang)}</span>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/40">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{t('taxRateLabel', lang)}</span>
                                    <span className="text-xs font-mono font-bold text-slate-200">%{cityRate}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/40">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{t('dailyGain', lang)}</span>
                                    <span className="text-xs font-mono font-bold text-emerald-400">+{dailyTax.toLocaleString()} 🪙</span>
                                  </div>
                                </div>
                              </div>
                            </div>


                          </div>
                        );
                      })()
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                        <div className="relative">
                          <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full"></div>
                          <Crown className="w-24 h-24 text-amber-600 relative z-10" />
                        </div>
                        <div className="max-w-xs">
                          <h3 className="text-xl font-bold text-white mb-2 tracking-widest">{t('managementPanel', lang)}</h3>
                          <p className="text-xs text-slate-400 font-sans-body leading-relaxed">
                            {t('selectCityFromListDesc', lang)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {playerMenuTab === 'conquered' && (
                <div className="h-full overflow-y-auto p-12 custom-scrollbar">
                  <div className="max-w-6xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
                      <div className="space-y-2">
                        <h2 className="text-4xl font-extrabold text-emerald-400 tracking-tighter">{t('domainsOfSovereignty', lang)}</h2>
                        <p className="text-sm text-slate-400 font-sans-body">{t('conqueredNationsDesc', lang)}</p>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-4">
                        {/* Tribute Accumulation Box */}
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center space-x-6">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{t('accumulatedTribute', lang)}</span>
                            <div className="flex items-center space-x-2">
                              <Coins className="w-5 h-5 text-amber-400" />
                              <span className="text-2xl font-mono font-black text-amber-400">{tributeBalance.toLocaleString()} 🪙</span>
                            </div>
                            <span className="text-[10px] text-emerald-500 font-mono">+{getDailyTributeIncome().toLocaleString()} 🪙 / {t('dayShort', lang)}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (tributeBalance > 0) {
                                setGold(prev => prev + tributeBalance);
                                soundFx.playSuccess();
                                addLog(
                                  `💰 TANZİMAT ALINDI: ${tributeBalance.toLocaleString()} 🪙 hazineye eklendi.`,
                                  `💰 TRIBUTE COLLECTED: ${tributeBalance.toLocaleString()} 🪙 added to treasury.`
                                );
                                setTributeBalance(0);
                              }
                            }}
                            disabled={tributeBalance === 0}
                            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                              tributeBalance > 0 
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <Wallet className="w-5 h-5" />
                            <span>{t('collectTribute', lang)}</span>
                          </button>
                        </div>

                        <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder={t('searchConqueredCountry', lang)}
                          value={conqueredSearchQuery}
                          onChange={(e) => setConqueredSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-slate-200 focus:outline-none focus:border-emerald-600 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans-body">
                      {WORLD_COUNTRIES
                        .filter(c => conqueredCountryCodes.includes(c.code.toLowerCase()) && c.name.toLowerCase().includes(conqueredSearchQuery.toLowerCase()))
                        .map((c) => {
                          const countryCities = getCountryCities(c.code);
                          return (
                            <div key={c.code} className="group bg-slate-900/40 border border-slate-800/60 hover:border-emerald-600/50 rounded-3xl p-6 transition-all duration-500 hover:translate-y-[-4px] hover:shadow-[0_10px_30px_rgba(5,150,105,0.1)]">
                              <div className="flex items-start justify-between mb-4">
                                <div className="relative">
                                  <img src={c.flagUrl} alt={c.name} className="w-16 h-10 rounded-lg object-cover border border-slate-700 shadow-md group-hover:scale-105 transition-transform" />
                                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 p-1 rounded-full border-2 border-[#050811]">
                                    <Shield className="w-3 h-3" />
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold text-emerald-500 tracking-[0.2em] font-mono">{t('underSovereignty', lang)}</span>
                              </div>
                              <div className="space-y-4">
                                <h4 className="text-xl font-bold text-white tracking-tight">{c.name}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40">
                                    <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">{t('capital', lang)}</p>
                                    <p className="text-xs text-slate-200">{c.capital}</p>
                                  </div>
                                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40">
                                    <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">{t('citiesCount', lang)}</p>
                                    <p className="text-xs text-slate-200">{countryCities.length}</p>
                                  </div>
                                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 col-span-2 flex justify-between items-center">
                                    <div>
                                      <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">{t('dailyTribute', lang)}</p>
                                      <p className="text-xs text-emerald-400 font-mono">+{getTributeIncome(c).toLocaleString()} 🪙</p>
                                    </div>
                                    <div className="bg-emerald-500/10 px-2 py-1 rounded text-[10px] text-emerald-500 font-bold">
                                      {getCountryTier(c) === 1 ? t('tierVeryAdvanced', lang) : 
                                       getCountryTier(c) === 2 ? t('tierAdvanced', lang) :
                                       getCountryTier(c) === 3 ? t('tierAboveAverage', lang) :
                                       getCountryTier(c) === 4 ? t('tierAverage', lang) :
                                       getCountryTier(c) === 5 ? t('tierBelowAverage', lang) : t('tierUnderdeveloped', lang)}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    soundFx.playClick();
                                    setIsPlayerMenuOpen(false);
                                    setSelectedCountryCode(c.code.toLowerCase());
                                  }}
                                  className="w-full py-2.5 bg-emerald-950/40 hover:bg-emerald-600 hover:text-slate-950 text-emerald-400 border border-emerald-900/50 rounded-xl text-[11px] font-bold transition-all"
                                >
                                  {t('focusOnMap', lang)}
                                </button>
                              </div>
                            </div>
                          );
                        })}

                      {conqueredCountryCodes.length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 opacity-30 text-center">
                          <Globe className="w-20 h-20 text-slate-600" />
                          <div className="max-w-xs">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{t('horizonsNotYetExplored', lang)}</p>
                            <p className="text-xs text-slate-500 font-sans-body">{t('conqueredEmptyDesc', lang)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {playerMenuTab === 'enemies' && (
                <div className="h-full overflow-y-auto p-12 custom-scrollbar">
                  <div className="max-w-6xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
                      <div className="space-y-2">
                        <h2 className="text-4xl font-extrabold text-red-500 tracking-tighter flex items-center gap-3">
                          <Swords className="w-8 h-8 text-red-500" />
                          <span>{t('enemyCountriesFronts', lang)}</span>
                        </h2>
                        <p className="text-sm text-slate-400 font-sans-body">{t('enemyCountriesDesc', lang)}</p>
                      </div>

                      <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder={t('searchEnemyCountryPlaceholder', lang)}
                          value={enemySearchQuery}
                          onChange={(e) => setEnemySearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-slate-200 focus:outline-none focus:border-red-600 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans-body">
                      {WORLD_COUNTRIES
                        .filter(c => 
                          warCountryCodes.includes(c.code.toLowerCase()) && 
                          !conqueredCountryCodes.includes(c.code.toLowerCase()) && 
                          c.name.toLowerCase().includes(enemySearchQuery.toLowerCase())
                        )
                        .map((c) => {
                          const countryCities = getCountryCities(c.code);
                          const stats = getCountryStats(c);
                          const totalEnemyTroops = countryCities.reduce((acc, city) => acc + getCityTroops(city.id, c.code), 0);

                          return (
                            <div key={c.code} className="group bg-slate-900/40 border border-red-900/40 hover:border-red-600/60 rounded-3xl p-6 transition-all duration-500 hover:translate-y-[-4px] hover:shadow-[0_10px_30px_rgba(220,38,38,0.15)] relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-red-600/10 transition-all"></div>

                              <div className="flex items-start justify-between mb-4">
                                <div className="relative">
                                  <img src={c.flagUrl} alt={c.name} className="w-16 h-10 rounded-lg object-cover border border-slate-700 shadow-md group-hover:scale-105 transition-transform" />
                                  <div className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full border-2 border-[#050811]">
                                    <Swords className="w-3 h-3" />
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold text-red-500 tracking-[0.2em] font-mono px-2.5 py-1 bg-red-950/60 border border-red-800/40 rounded-full">{t('atWarStatus', lang)}</span>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-xl font-bold text-white tracking-tight">{c.name}</h4>
                                  <p className="text-xs text-slate-400">{t('capital', lang)}: <span className="text-slate-200">{c.capital}</span></p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40">
                                    <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">{t('activeArmy', lang)}</p>
                                    <p className="text-xs text-red-400 font-mono font-bold">{stats.activeMilitary}</p>
                                  </div>
                                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40">
                                    <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">{t('militaryRank', lang)}</p>
                                    <p className="text-xs text-amber-400 font-mono font-bold">{stats.militaryRank}</p>
                                  </div>
                                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 col-span-2 flex justify-between items-center">
                                    <div>
                                      <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">{t('remainingCitiesCount', lang)}</p>
                                      <p className="text-xs text-slate-200 font-mono">{countryCities.length} {t('citiesCount', lang)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">{t('garrisonForce', lang)}</p>
                                      <p className="text-xs text-red-400 font-mono font-bold">{totalEnemyTroops.toLocaleString()} {t('soldiers', lang)}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                  <button
                                    onClick={() => {
                                      soundFx.playClick();
                                      setIsPlayerMenuOpen(false);
                                      setSelectedCountryCode(c.code.toLowerCase());
                                    }}
                                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center space-x-1"
                                  >
                                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                                    <span>{t('viewOnMap', lang)}</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      soundFx.playClick();
                                      setPeaceOfferCountry(c);
                                      setPeaceOfferGold(50000);
                                      setPeaceOfferResult(null);
                                    }}
                                    className="py-2.5 bg-emerald-950/60 hover:bg-emerald-600 text-emerald-400 hover:text-slate-950 border border-emerald-800/50 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center space-x-1"
                                  >
                                    <Handshake className="w-3.5 h-3.5" />
                                    <span>{t('offerPeace', lang)}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      {WORLD_COUNTRIES.filter(c => 
                        warCountryCodes.includes(c.code.toLowerCase()) && 
                        !conqueredCountryCodes.includes(c.code.toLowerCase())
                      ).length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 opacity-40 text-center">
                          <div className="p-4 bg-slate-900/80 rounded-full border border-slate-800 text-emerald-500">
                            <Shield className="w-16 h-16" />
                          </div>
                          <div className="max-w-md space-y-2">
                            <p className="text-base font-bold text-slate-200 tracking-wider uppercase">{t('noEnemiesAtWar', lang)}</p>
                            <p className="text-xs text-slate-400 font-sans-body leading-relaxed">
                              {t('noEnemiesAtWarDesc', lang)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {playerMenuTab === 'treaties' && (
                <div className="h-full overflow-y-auto p-12 custom-scrollbar">
                  <div className="max-w-6xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
                      <div className="space-y-2">
                        <h2 className="text-4xl font-extrabold text-cyan-400 tracking-tighter">{t('diplomaticArchive', lang)}</h2>
                        <p className="text-sm text-slate-400 font-sans-body">{t('diplomaticArchiveDesc', lang)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans-body">
                      {WORLD_COUNTRIES
                        .filter(c => {
                          const treatyData = signedTreaties[c.code.toLowerCase()];
                          return treatyData && (treatyData.pact || treatyData.trade || treatyData.alliance);
                        })
                        .map(c => {
                          const treatyData = signedTreaties[c.code.toLowerCase()] || { pact: false, trade: false, alliance: false };
                          return (
                            <div key={c.code} className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 space-y-6 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-cyan-500/10 transition-all"></div>
                              
                              <div className="flex items-center space-x-4">
                                <img src={c.flagUrl} alt={c.name} className="w-14 h-9 rounded shadow border border-slate-800" />
                                <div>
                                  <h4 className="text-lg font-bold text-white tracking-tight">{c.name}</h4>
                                  <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">{t('activeRelations', lang)}</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {treatyData.pact && (
                                  <div className="flex items-center space-x-3 bg-cyan-950/30 border border-cyan-800/30 p-3 rounded-2xl">
                                    <Shield className="w-4 h-4 text-cyan-400" />
                                    <span className="text-xs font-bold text-cyan-100">{t('pact', lang)}</span>
                                  </div>
                                )}
                                {treatyData.trade && (
                                  <div className="bg-amber-950/30 border border-amber-800/40 p-3.5 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <TrendingUp className="w-4 h-4 text-amber-400" />
                                        <span className="text-xs font-bold text-amber-100 font-cinzel">{t('trade', lang)}</span>
                                      </div>
                                      <span className="text-[9px] font-mono px-2 py-0.5 bg-amber-900/40 text-amber-300 border border-amber-700/50 rounded-full font-bold">{t('active', lang)}</span>
                                    </div>

                                    {/* Ülke Alım Fiyatları */}
                                    {(() => {
                                      const mult = getEconomyMultiplier(c.code);
                                      return (
                                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                                          <p className="text-[10px] text-slate-400 font-sans-body uppercase tracking-wider font-bold">{t('countryPurchasePrices', lang)}:</p>
                                          <div className="grid grid-cols-3 gap-1 text-center">
                                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                                              <span className="text-[9px] text-slate-400 block">1g {t('goldLabel', lang)}</span>
                                              <span className="text-amber-400 font-bold text-[11px]">{Math.floor(300 * mult).toLocaleString()} 🪙</span>
                                            </div>
                                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                                              <span className="text-[9px] text-slate-400 block">1g {t('diamonds', lang)}</span>
                                              <span className="text-cyan-400 font-bold text-[11px]">{Math.floor(500 * mult).toLocaleString()} 🪙</span>
                                            </div>
                                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                                              <span className="text-[9px] text-slate-400 block">1L {t('oil', lang)}</span>
                                              <span className="text-amber-500 font-bold text-[11px]">{Math.floor(1000 * mult).toLocaleString()} 🪙</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* Sat Butonu */}
                                    <button
                                      onClick={() => {
                                        soundFx.playClick();
                                        setIsPlayerMenuOpen(false);
                                        setShowTradeModal(c.code.toLowerCase());
                                        setTradeResourceType('diamonds');
                                        setTradeAmount(0);
                                      }}
                                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-cinzel cursor-pointer"
                                    >
                                      <Coins className="w-4 h-4" />
                                      <span>{t('sellResourceExport', lang)}</span>
                                    </button>
                                  </div>
                                )}
                                {treatyData.alliance && (
                                  <div className="flex items-center space-x-3 bg-blue-950/30 border border-blue-800/30 p-3 rounded-2xl">
                                    <Crown className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs font-bold text-blue-100">{t('alliance', lang)}</span>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => {
                                  soundFx.playClick();
                                  setIsPlayerMenuOpen(false);
                                  setSelectedCountryCode(c.code.toLowerCase());
                                }}
                                className="w-full py-2.5 bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest"
                              >
                                {t('goToDiplomaticCenter', lang)}
                              </button>
                            </div>
                          );
                        })}

                      {Object.values(signedTreaties).every(t => !(t as any).pact && !(t as any).trade && !(t as any).alliance) && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 opacity-30 text-center">
                          <Scroll className="w-20 h-20 text-slate-600" />
                          <div className="max-w-xs">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{t('diplomaticSilence', lang)}</p>
                            <p className="text-xs text-slate-500 font-sans-body">{t('diplomaticSilenceDesc', lang)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade Modal */}
      <AnimatePresence>
        {showTradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans-body"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-amber-600/40 rounded-xl p-5 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-amber-300 font-cinzel flex items-center space-x-2">
                  <Pickaxe className="w-5 h-5 text-amber-500" />
                  <span>Maden İhracatı</span>
                </h3>
                <button
                  onClick={() => setShowTradeModal(null)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Hedef Ülke: </span>
                    <span className="text-amber-100 font-bold">{WORLD_COUNTRIES.find(c => c.code === showTradeModal)?.name}</span>
                  </div>
                  {(() => {
                    const mult = getEconomyMultiplier(showTradeModal || '');
                    return (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400">1 Birim Alım Fiyatı:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-300">⛏️ 1g Altın: <strong>{Math.floor(300 * mult).toLocaleString()} 🪙</strong></span>
                          <span className="text-cyan-300">💎 1g Elmas: <strong>{Math.floor(500 * mult).toLocaleString()} 🪙</strong></span>
                          <span className="text-amber-400">🛢️ 1L Petrol: <strong>{Math.floor(1000 * mult).toLocaleString()} 🪙</strong></span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Satılacak Kaynak</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'diamonds', name: 'Elmas', icon: '💎', total: getPlayerTotalResources().diamonds, price: 500, unit: 'gram' },
                      { id: 'goldOre', name: 'Altın Cevheri', icon: '⛏️', total: getPlayerTotalResources().goldOre, price: 300, unit: 'gram' },
                      { id: 'oil', name: 'Petrol', icon: '🛢️', total: getPlayerTotalResources().oil, price: 1000, unit: 'L' }
                    ].map(res => (
                      <button
                        key={res.id}
                        onClick={() => {
                          setTradeResourceType(res.id as any);
                          setTradeAmount(0);
                        }}
                        className={`p-2 rounded border flex flex-col items-center justify-center text-center space-y-1 transition ${
                          tradeResourceType === res.id 
                            ? 'bg-amber-900/40 border-amber-500 text-amber-100' 
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-lg">{res.icon}</span>
                        <span className="text-[10px] font-bold">{res.name}</span>
                        <span className="text-[9px] font-mono text-amber-400/80">{res.total.toLocaleString()} {res.unit}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const maxAmt = getPlayerTotalResources()[tradeResourceType];
                  let basePricePerUnit = 0;
                  if (tradeResourceType === 'diamonds') basePricePerUnit = 500;
                  if (tradeResourceType === 'goldOre') basePricePerUnit = 300;
                  if (tradeResourceType === 'oil') basePricePerUnit = 1000;
                  
                  const multiplier = getEconomyMultiplier(showTradeModal);
                  const pricePerUnit = Math.floor(basePricePerUnit * multiplier);
                  
                  return (
                    <div className="space-y-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Miktar:</span>
                        <span className="text-amber-300 font-mono font-bold">{tradeAmount.toLocaleString()}</span>
                      </div>
                      
                      <input
                        type="range"
                        min="0"
                        max={maxAmt}
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(Number(e.target.value))}
                        className="w-full accent-amber-500 bg-slate-950 h-2 rounded cursor-pointer"
                      />
                      
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800/50">
                        <span className="text-slate-400">Toplam Gelir:</span>
                        <span className="text-amber-400 font-bold font-mono">{(tradeAmount * pricePerUnit).toLocaleString()} 🪙</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={handlePerformTrade}
                  disabled={tradeAmount <= 0}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed font-cinzel text-sm"
                >
                  SATIŞI ONAYLA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Savaş ve Kuşatma Raporu Modal */}
      <AnimatePresence>
        {battleReport?.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-cinzel"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="w-full max-w-xl bg-slate-950 border border-amber-600/40 p-6 rounded-xl shadow-2xl space-y-6 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-red-600 to-amber-600"></div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-amber-500 tracking-widest uppercase flex items-center justify-center space-x-1.5">
                  <Swords className="w-4 h-4 text-red-500" />
                  <span>RESMİ SAVAŞ VE KUŞATMA RAPORU</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center space-x-2">
                  <span>🏆 ZAFERLİ FETİH RAPORU</span>
                </h2>
                <div className="text-xs text-slate-400">
                  Hedef Bölge: <strong className="text-white">{battleReport.targetCountry.name} — {battleReport.city.name}</strong> • Savaş Süresi: <strong className="text-amber-400">{battleReport.duration} Saniye</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Player Stats */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 text-left">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                    <img src={playerCountry.flagUrl} alt={playerCountry.name} className="w-8 h-6 rounded object-cover border border-slate-700" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">{playerCountry.name}</div>
                      <div className="text-[10px] text-amber-500">Saldıran Ordu</div>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Önceki Birlik:</span>
                      <strong className="text-slate-200">{battleReport.playerTroopsBefore.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Savaş Kaybı:</span>
                      <strong className="text-red-400">-{battleReport.playerLosses.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1">
                      <span>Kalan Birlik:</span>
                      <strong className="text-emerald-400">{battleReport.playerRemaining.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Target Stats */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 text-left">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                    <img src={battleReport.targetCountry.flagUrl} alt={battleReport.targetCountry.name} className="w-8 h-6 rounded object-cover border border-slate-700" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">{battleReport.targetCountry.name}</div>
                      <div className="text-[10px] text-red-500">Savunma Garnizonu</div>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Düşman Birlik:</span>
                      <strong className="text-slate-200">{battleReport.enemyTroopsBefore.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Yok Edilen:</span>
                      <strong className="text-red-400">-{battleReport.enemyLosses.toLocaleString()} (0)</strong>
                    </div>
                    <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1">
                      <span>Şehir Durumu:</span>
                      <strong className="text-amber-400">Feth Edildi ✓</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded text-xs text-slate-300 leading-relaxed text-left font-sans-body">
                <p>💡 <strong className="text-white">Detaylı Rapor:</strong> Birlikleriniz {battleReport.duration} saniye süren kuşatmanın ardından düşman savunmasını yardı. Düşman garnizonu sıfırlandı ve savaştan kalan ordunuz emrinize amade oldu.</p>
              </div>

              <button
                onClick={() => setBattleReport(null)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded transition shadow-lg font-cinzel cursor-pointer"
              >
                RAPORU ONAYLA VE KAPAT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Savaş Onaylama Modal (Emin misin?) */}
      <AnimatePresence>
        {pendingSiegeCity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-cinzel"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="w-full max-w-md bg-slate-950 border border-red-800 p-6 rounded-xl shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-red-500 tracking-widest uppercase flex items-center justify-center space-x-1.5">
                  <Swords className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>SAVAŞ VE KUŞATMA ONAYI</span>
                </div>
                <h2 className="text-xl font-bold text-slate-100">
                  {pendingSiegeCity.city.name} Kuşatılsın mı?
                </h2>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded text-xs space-y-2 text-left font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Hedef Ülke:</span>
                  <strong className="text-amber-400">{pendingSiegeCity.targetCountry.name}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Askeri Gücünüz:</span>
                  <strong className="text-blue-400">{pendingSiegeCity.playerTroops.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Düşman Savunması:</span>
                  <strong className="text-red-400">{pendingSiegeCity.enemyTroops.toLocaleString()}</strong>
                </div>
                {pendingSiegeCity.playerTroops < pendingSiegeCity.enemyTroops && (
                  <div className="p-2 bg-red-950/60 border border-red-800 text-red-300 rounded text-[11px] font-sans-body">
                    ⚠️ <strong className="text-white">Uyarı:</strong> Düşmanın kuvveti ordunuzdan fazla! Buna rağmen göğüs göğüse muharebeye girmek istediğinize emin misiniz?
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setPendingSiegeCity(null)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded transition font-cinzel"
                >
                  VAZGEÇ
                </button>
                <button
                  onClick={confirmAndStartSiege}
                  className="py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded transition shadow-lg font-cinzel"
                >
                  EVET, SAVAŞI BAŞLAT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barış Teklifi Modal */}
      <AnimatePresence>
        {peaceOfferCountry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-cinzel"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="w-full max-w-md bg-slate-950 border border-amber-600/50 p-6 rounded-2xl shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500"></div>

              {/* Header */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-amber-500 tracking-widest uppercase flex items-center justify-center space-x-1.5">
                  <Handshake className="w-4 h-4 text-emerald-400" />
                  <span>BARIŞ VE ATEŞKES DİPLOMASİSİ</span>
                </div>
                <div className="flex items-center justify-center space-x-3 pt-1">
                  <img src={peaceOfferCountry.flagUrl} alt={peaceOfferCountry.name} className="w-10 h-7 rounded object-cover border border-slate-700 shadow" />
                  <h2 className="text-2xl font-bold text-slate-100">{peaceOfferCountry.name}</h2>
                </div>
              </div>

              {!peaceOfferResult ? (
                <div className="space-y-5 font-sans-body text-left">
                  <p className="text-xs text-slate-400 leading-relaxed text-center">
                    Savaşı sonlandırmak için düşman devlet liderine tazminat altını teklif edin.
                  </p>

                  {/* Gold Offer Slider */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Teklif Edilen Altın:</span>
                      <span className="text-amber-400 font-mono font-bold text-base">{peaceOfferGold.toLocaleString()} 🪙</span>
                    </div>

                    <input
                      type="range"
                      min={20000}
                      max={120000}
                      step={5000}
                      value={peaceOfferGold}
                      onChange={(e) => setPeaceOfferGold(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />

                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>20.000 🪙 (%1)</span>
                      <span>50.000 🪙 (%30)</span>
                      <span>120.000 🪙 (%100)</span>
                    </div>
                  </div>

                  {/* Acceptance Percentage Calculation */}
                  {(() => {
                    const acceptanceChance = Math.min(100, Math.max(1, Math.round(1 + ((peaceOfferGold - 20000) / (120000 - 20000)) * 99)));
                    const hasEnoughGold = gold >= peaceOfferGold;

                    return (
                      <div className="space-y-3">
                        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                              <Percent className="w-4 h-4 text-emerald-400" />
                              <span>Kabul Etme İhtimali:</span>
                            </span>
                            <span className={`text-base font-mono font-bold ${
                              acceptanceChance >= 70 ? 'text-emerald-400' : acceptanceChance >= 35 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              %{acceptanceChance}
                            </span>
                          </div>

                          {/* Visual Bar */}
                          <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                acceptanceChance >= 70 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : acceptanceChance >= 35 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-red-500'
                              }`}
                              style={{ width: `${acceptanceChance}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center px-1 text-xs">
                          <span className="text-slate-400">Mevcut Hazine Altınınız:</span>
                          <span className={`font-mono font-bold ${hasEnoughGold ? 'text-amber-400' : 'text-red-500'}`}>
                            {gold.toLocaleString()} 🪙
                          </span>
                        </div>

                        {!hasEnoughGold && (
                          <p className="text-[11px] text-red-400 font-semibold text-center bg-red-950/40 p-2 rounded border border-red-900/50">
                            ⚠️ Hazinenizde teklif ettiğiniz miktarda altın bulunmuyor!
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2 font-cinzel">
                          <button
                            onClick={() => setPeaceOfferCountry(null)}
                            className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
                          >
                            VAZGEÇ
                          </button>
                          <button
                            disabled={!hasEnoughGold}
                            onClick={() => {
                              const roll = Math.floor(Math.random() * 100) + 1;
                              setGold(g => g - peaceOfferGold);
                              if (roll <= acceptanceChance) {
                                soundFx.playSuccess();
                                setWarCountryCodes(prev => prev.filter(code => code.toLowerCase() !== peaceOfferCountry.code.toLowerCase()));
                                setPeaceOfferResult({
                                  success: true,
                                  message: `🕊️ BARIŞ KABUL EDİLDİ! ${peaceOfferCountry.name} devleti ${peaceOfferGold.toLocaleString()} 🪙 tazminat karşılığında antlaşmayı onayladı ve savaş sona erdi.`
                                });
                                setLogs(prev => [`🕊️ BARIŞ KABUL EDİLDİ: ${peaceOfferCountry.name} ile ${peaceOfferGold.toLocaleString()} 🪙 karşılığında barış yapıldı.`, ...prev.slice(0, 10)]);
                              } else {
                                soundFx.playClick();
                                setPeaceOfferResult({
                                  success: false,
                                  message: `❌ BARIŞ TEKLİFİ REDDEDİLDİ! ${peaceOfferCountry.name} hükümdarı sunduğunuz ${peaceOfferGold.toLocaleString()} 🪙 elçi tazminatını kabul etmedi ve altın el konuldu.`
                                });
                                setLogs(prev => [`❌ BARIŞ TEKLİFİ REDDEDİLDİ: ${peaceOfferCountry.name} devleti teklif edilen ${peaceOfferGold.toLocaleString()} 🪙 miktarını yetersiz buldu.`, ...prev.slice(0, 10)]);
                              }
                            }}
                            className="py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                          >
                            TEKLİFİ GÖNDER
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Result Screen */
                <div className="space-y-5 font-sans-body text-center py-2">
                  <div className={`p-4 rounded-xl border text-sm leading-relaxed ${
                    peaceOfferResult.success
                      ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
                      : 'bg-red-950/60 border-red-600/60 text-red-200'
                  }`}>
                    {peaceOfferResult.message}
                  </div>

                  <button
                    onClick={() => {
                      setPeaceOfferCountry(null);
                      setPeaceOfferResult(null);
                    }}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition font-cinzel cursor-pointer"
                  >
                    TAMAM
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Exit & Save Confirmation Modal */}
        {isExitConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-cinzel select-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="w-full max-w-md bg-slate-950 border-2 border-amber-600/70 rounded-2xl p-6 shadow-[0_0_50px_rgba(217,119,6,0.25)] space-y-5 text-slate-100 relative overflow-hidden"
            >
              {/* Glow Header */}
              <div className="flex items-center space-x-3 border-b border-amber-600/40 pb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-md">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-200 tracking-wide uppercase">
                    {t('quitTitle', lang)}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {t('quitSubTitle', lang)}
                  </p>
                </div>
              </div>

              {/* Confirmation Body */}
              <div className="space-y-3 font-sans-body text-xs leading-relaxed text-slate-300">
                <p className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
                  {t('quitDesc', lang).replace('${country}', playerCountry.name).replace('${turn}', turn.toString())}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 font-cinzel">
                {/* Save and Exit */}
                <button
                  onClick={() => {
                    soundFx.playSuccess();
                    handleSaveGame();
                    setIsExitConfirmOpen(false);
                    onReturnToMenu();
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>{t('saveAndReturn', lang)}</span>
                </button>

                {/* Exit without Saving */}
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setIsExitConfirmOpen(false);
                    onReturnToMenu();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-red-950/80 border border-slate-800 hover:border-red-700/80 text-slate-300 hover:text-red-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('exitWithoutSaving', lang)}</span>
                </button>

                {/* Cancel */}
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setIsExitConfirmOpen(false);
                  }}
                  className="w-full py-2 px-4 text-slate-400 hover:text-slate-200 text-[11px] font-mono transition text-center cursor-pointer"
                >
                  {t('cancelContinue', lang)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign & Event Log History Modal */}
      <AnimatePresence>
        {showLogsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-cinzel select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-slate-950 border border-amber-600/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-5 relative max-h-[85vh] flex flex-col overflow-hidden text-slate-100"
            >
              <button
                onClick={() => setShowLogsModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <Sparkles className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{t('campaignLogModalTitle', lang)}</h3>
                  <p className="text-xs text-slate-400 font-sans-body">
                    {t('campaignLogModalSub', lang)}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar font-mono text-xs">
                {logs.length > 0 ? (
                  logs.map((logItem, idx) => (
                    <div
                      key={`log-${idx}-${typeof logItem === 'string' ? logItem.slice(0, 15) : idx}`}
                      className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start space-x-3 hover:border-amber-600/40 transition"
                    >
                      <span className="text-amber-500 font-bold flex-shrink-0 mt-0.5">•</span>
                      <p className="text-slate-200 leading-relaxed font-sans-body">
                        {formatLog(logItem, lang)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <p className="font-bold text-sm">{t('noLogsRecorded', lang)}</p>
                    <p className="text-xs font-sans-body">{t('noLogsRecordedDesc', lang)}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition font-cinzel shadow cursor-pointer uppercase tracking-wider"
                >
                  {t('close', lang)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
