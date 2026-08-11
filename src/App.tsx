import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Shield, ArrowLeft, Flame, Swords, Sparkles } from 'lucide-react';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { LoadGameModal } from './components/LoadGameModal';
import { SettingsModal } from './components/SettingsModal';
import { QuitModal } from './components/QuitModal';
import { InGameView } from './components/InGameView';
import { CountrySelectModal } from './components/CountrySelectModal';
import { NewGameWizard } from './components/NewGameWizard';
import { GameLoadingOverlay } from './components/GameLoadingOverlay';
import { CharacterClass, Difficulty, GameSettings, MenuAction, SaveSlot } from './types';
import { WORLD_COUNTRIES, Country } from './data/countries';
import { soundFx } from './utils/sound';
import { t } from './utils/i18n';

export default function App() {
  const [activeMenu, setActiveMenu] = useState<MenuAction>('none');
  const [menuView, setMenuView] = useState<'main' | 'difficulty' | 'country' | 'wizard'>('main');

  const [isScreenTransitioning, setIsScreenTransitioning] = useState(false);
  const [isFirstGameEntry, setIsFirstGameEntry] = useState<boolean>(() => {
    return !localStorage.getItem('kahya_has_entered_game_v1');
  });

  const [pendingNewGameParams, setPendingNewGameParams] = useState<{
    heroName: string;
    rulerTitle: string;
    dynastyName: string;
    kingdomOath: string;
    difficulty: Difficulty;
    country: Country;
  } | null>(null);

  const [pendingLoadSlot, setPendingLoadSlot] = useState<SaveSlot | null>(null);

  const handleStartGameFromWizard = (
    heroName: string,
    rulerTitle: string,
    dynastyName: string,
    kingdomOath: string,
    difficulty: Difficulty,
    country: Country
  ) => {
    soundFx.playStartGame();
    setPendingNewGameParams({
      heroName,
      rulerTitle,
      dynastyName,
      kingdomOath,
      difficulty,
      country,
    });
  };

  const getInitialGoldForDiff = (diff: string) => {
    const d = diff.toLowerCase();
    if (d === 'kolay' || d === 'easy') return 200000;
    if (d === 'zor' || d === 'hard') return 100000;
    if (d === 'kabus' || d === 'nightmare') return 50000;
    return 150000; // normal
  };

  const finalizeNewGameCreation = () => {
    if (!pendingNewGameParams) return;
    const { heroName, rulerTitle, dynastyName, kingdomOath, difficulty, country } = pendingNewGameParams;
    setSelectedDifficulty(difficulty);
    setSelectedCountry(country);
    setGameState({
      heroName: heroName,
      heroClass: lang === 'English' ? "KING'S CHANCELLOR" : "KRALIN KAHYASI",
      difficulty: difficulty,
    });

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newSlot: SaveSlot = {
      id: saveSlots.length > 0 ? Math.max(...saveSlots.map((s) => s.id)) + 1 : 1,
      characterName: heroName,
      characterClass: lang === 'English' ? "KING'S CHANCELLOR" : 'KRALIN KAHYASI',
      level: 1,
      playtime: `${t('turnLabel', lang)} 1`,
      savedAt: formattedDate,
      chapter: lang === 'English' ? `Chapter: ${country.name} Campaign (Turn 1)` : `Bölüm: ${country.name} Seferi (Tur 1)`,
      healthPercent: 100,
      difficulty: difficulty.toUpperCase(),
      rulerTitle: rulerTitle,
      dynastyName: dynastyName,
      kingdomOath: kingdomOath,
      countryName: country.name,
      countryCode: country.code,
      countryFlag: country.flagUrl,
      turn: 1,
      gold: getInitialGoldForDiff(difficulty),
      incomePerTurn: 4800,
      conqueredCountryCodes: [],
      alliedCountryCodes: ['az'],
      warCountryCodes: [],
    };
    updateSaveSlots([newSlot, ...saveSlots]);
    setActiveSaveData(newSlot);
    setMenuView('main');
    setActiveMenu('playing');
    setPendingNewGameParams(null);

    // Mark that player has entered game at least once
    localStorage.setItem('kahya_has_entered_game_v1', 'true');
    setIsFirstGameEntry(false);
  };
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const [hoveredDifficulty, setHoveredDifficulty] = useState<Difficulty | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(WORLD_COUNTRIES[0]);

  // Save Slots State (Persisted in localStorage)
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>(() => {
    try {
      const saved = localStorage.getItem('kahya_save_slots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const updateSaveSlots = (newSlots: SaveSlot[]) => {
    setSaveSlots(newSlots);
    try {
      localStorage.setItem('kahya_save_slots', JSON.stringify(newSlots));
    } catch {
      // ignore
    }
  };

  const handleDeleteSlot = (id: number) => {
    const updated = saveSlots.filter((slot) => slot.id !== id);
    updateSaveSlots(updated);
  };

  // Active game session state
  const [gameState, setGameState] = useState<{
    heroName: string;
    heroClass: CharacterClass;
    difficulty: Difficulty;
  }>({
    heroName: 'KAHYA LORDU',
    heroClass: 'kahya',
    difficulty: 'normal',
  });

  // System Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('kahya_game_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        soundFx.updateVolumes(
          parsed.soundEnabled ?? true,
          parsed.masterVolume ?? 80,
          parsed.sfxVolume ?? 85,
          parsed.musicVolume ?? 70
        );
        return parsed;
      }
    } catch {}
    const defaultSettings: GameSettings = {
      masterVolume: 80,
      musicVolume: 60,
      sfxVolume: 85,
      soundEnabled: true,
      graphicsQuality: 'Yüksek',
      resolution: '1920x1080',
      fullscreen: false,
      vsync: true,
      ambientParticles: true,
      language: 'Türkçe',
    };
    soundFx.updateVolumes(
      defaultSettings.soundEnabled,
      defaultSettings.masterVolume,
      defaultSettings.sfxVolume,
      defaultSettings.musicVolume
    );
    return defaultSettings;
  });

  const lang = settings.language;

  // Start ambient music on app load automatically (with interaction fallback for browser autoplay policies)
  useEffect(() => {
    if (settings.soundEnabled && settings.masterVolume > 0 && settings.musicVolume > 0) {
      soundFx.startAmbientMusic();
    }
    const handleFirstInteraction = () => {
      if (settings.soundEnabled && settings.masterVolume > 0 && settings.musicVolume > 0) {
        soundFx.startAmbientMusic();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [settings]);

  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('kahya_game_settings', JSON.stringify(newSettings));
    } catch {}

    soundFx.updateVolumes(
      newSettings.soundEnabled,
      newSettings.masterVolume,
      newSettings.sfxVolume,
      newSettings.musicVolume
    );

    if (newSettings.soundEnabled && newSettings.masterVolume > 0 && newSettings.musicVolume > 0) {
      soundFx.startAmbientMusic();
    } else {
      soundFx.stopAmbientMusic();
    }

    if (newSettings.fullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!newSettings.fullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const mainMenuItems = [
    { id: 'new_game', label: t('newGame', lang) },
    { id: 'load_game', label: t('loadGame', lang) },
    { id: 'settings', label: t('settings', lang) },
    { id: 'quit', label: t('quit', lang) },
  ];

  const difficultyItems: { id: Difficulty; label: string; desc: string; icon: React.ReactNode; colorClass: string; stats: string }[] = [
    {
      id: 'kolay',
      label: t('easy', lang),
      desc: t('easyDesc', lang),
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      colorClass: 'hover:border-emerald-500/70 text-emerald-300',
      stats: `${t('enemyDamage', lang)}: %70 | ${t('rewardMultiplier', lang)}: 1.0x`,
    },
    {
      id: 'normal',
      label: t('normal', lang),
      desc: t('normalDesc', lang),
      icon: <Swords className="w-4 h-4 text-blue-400" />,
      colorClass: 'hover:border-blue-500/70 text-blue-300',
      stats: `${t('enemyDamage', lang)}: %100 | ${t('rewardMultiplier', lang)}: 1.25x`,
    },
    {
      id: 'zor',
      label: t('hard', lang),
      desc: t('hardDesc', lang),
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      colorClass: 'hover:border-amber-500/70 text-amber-300',
      stats: `${t('enemyDamage', lang)}: %140 | ${t('rewardMultiplier', lang)}: 1.75x`,
    },
    {
      id: 'kabus',
      label: t('nightmare', lang),
      desc: t('nightmareDesc', lang),
      icon: <Flame className="w-4 h-4 text-red-500" />,
      colorClass: 'hover:border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] text-red-400',
      stats: `${t('enemyDamage', lang)}: %200 | ${t('rewardMultiplier', lang)}: 2.50x`,
    },
  ];

  const [activeSaveData, setActiveSaveData] = useState<SaveSlot | null>(null);

  const handleMainMenuClick = (actionId: string) => {
    soundFx.playClick();
    setIsScreenTransitioning(true);
    setTimeout(() => {
      setIsScreenTransitioning(false);
      if (actionId === 'new_game') {
        setMenuView('wizard');
        setActiveHoverIndex(null);
        setHoveredDifficulty(null);
      } else if (actionId === 'load_game') {
        try {
          const saved = localStorage.getItem('kahya_save_slots');
          if (saved) {
            setSaveSlots(JSON.parse(saved));
          }
        } catch {
          // ignore
        }
        setActiveMenu('load_game');
      } else {
        setActiveMenu(actionId as MenuAction);
      }
    }, 250);
  };

  const handleDifficultySelect = (difficulty: Difficulty) => {
    soundFx.playClick();
    setSelectedDifficulty(difficulty);
    setGameState((prev) => ({
      ...prev,
      difficulty: difficulty,
    }));
    setMenuView('country');
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);

    // Generate a new save slot when starting a new game
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newSlot: SaveSlot = {
      id: saveSlots.length > 0 ? Math.max(...saveSlots.map((s) => s.id)) + 1 : 1,
      characterName: 'KAHYA MUSTAFA',
      characterClass: lang === 'English' ? "KING'S CHANCELLOR" : 'KRALIN KAHYASI',
      level: 1,
      playtime: `${t('turnLabel', lang)} 1`,
      savedAt: formattedDate,
      chapter: lang === 'English' ? `Chapter: ${country.name} Campaign (Turn 1)` : `Bölüm: ${country.name} Seferi (Tur 1)`,
      healthPercent: 100,
      difficulty: selectedDifficulty.toUpperCase(),
      countryName: country.name,
      countryCode: country.code,
      countryFlag: country.flagUrl,
      turn: 1,
      gold: getInitialGoldForDiff(selectedDifficulty),
      incomePerTurn: 4800,
      conqueredCountryCodes: [],
      alliedCountryCodes: ['az'],
      warCountryCodes: [],
    };
    updateSaveSlots([newSlot, ...saveSlots]);
    setActiveSaveData(newSlot);

    setActiveMenu('playing');
  };

  const handleLoadSave = (slot: SaveSlot) => {
    soundFx.playStartGame();
    setPendingLoadSlot(slot);
  };

  const finalizeLoadSave = () => {
    if (!pendingLoadSlot) return;
    const slot = pendingLoadSlot;
    const loadedCountry = WORLD_COUNTRIES.find((c) => c.name === slot.countryName) || WORLD_COUNTRIES[0];
    setSelectedCountry(loadedCountry);
    setGameState({
      heroName: slot.characterName,
      heroClass: slot.characterClass as CharacterClass,
      difficulty: slot.difficulty.toLowerCase() as Difficulty,
    });
    setActiveSaveData(slot);
    setActiveMenu('playing');
    setPendingLoadSlot(null);

    // Mark that player has entered game at least once
    localStorage.setItem('kahya_has_entered_game_v1', 'true');
    setIsFirstGameEntry(false);
  };

  const toggleSound = () => {
    const nextState = !settings.soundEnabled;
    soundFx.soundEnabled = nextState;
    soundFx.updateVolumes(nextState, settings.masterVolume, settings.sfxVolume, settings.musicVolume);
    setSettings((prev) => ({ ...prev, soundEnabled: nextState }));
    if (nextState) {
      soundFx.playClick();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Listen to 'F' or 'f' key to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
          return;
        }
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto fullscreen when played standalone
  useEffect(() => {
    const isEmbedded = window.self !== window.top;
    if (!isEmbedded) {
      const handleFirstInteraction = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };
      window.addEventListener('click', handleFirstInteraction);
      window.addEventListener('keydown', handleFirstInteraction);
      return () => {
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };
    }
  }, []);

  if (activeMenu === 'playing') {
    return (
      <InGameView
        heroName={gameState.heroName}
        heroClass={lang === 'English' ? "KING'S CHANCELLOR" : "KRALIN KAHYASI"}
        difficulty={gameState.difficulty.toUpperCase()}
        country={selectedCountry}
        initialSaveData={activeSaveData}
        settings={settings}
        onReturnToMenu={() => {
          setActiveMenu('none');
          setMenuView('main');
          setActiveSaveData(null);
        }}
      />
    );
  }

  const selectedDiffInfo = hoveredDifficulty ? difficultyItems.find((d) => d.id === hoveredDifficulty) : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0d14] text-slate-100 select-none font-cinzel">
      {/* Dynamic Ambient Canvas Background */}
      {settings.ambientParticles && <BackgroundCanvas particleCount={50} />}

      {/* Main Container */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        {/* Top Control Bar */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={toggleSound}
            onMouseEnter={() => soundFx.playHover()}
            className="p-2.5 rounded-md bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-900/50 transition-all backdrop-blur-sm"
            title={settings.soundEnabled ? t('muteSound', lang) : t('unmuteSound', lang)}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-500" />}
          </button>
        </div>

        {/* Center-Left Branding and Menu Block */}
        <div className="my-auto max-w-xl space-y-8 pl-2 sm:pl-6 lg:pl-12">
          {/* Header Title Section */}
          <motion.div
            key={menuView}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            {/* Main Title: KAHYA */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-[0.18em] text-metallic leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]">
              {t('titleMain', lang)}
            </h1>

            {/* Red Underline & Subtitle */}
            <div className="pt-2 space-y-2">
              <div className="w-full max-w-[340px] h-[2px] bg-gradient-to-r from-red-600 via-red-500 to-transparent red-line-glow" />
              <div className="text-base sm:text-lg font-bold tracking-[0.38em] text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] uppercase">
                {menuView === 'main' ? t('subtitleMain', lang) : t('subtitleDiff', lang)}
              </div>
            </div>
          </motion.div>

          {/* Menu Items List - Smooth Transition between Main and Difficulty */}
          <AnimatePresence mode="wait">
            {menuView === 'main' ? (
              <motion.div
                key="main-menu"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3.5 pt-4 w-full max-w-xs sm:max-w-sm"
              >
                {mainMenuItems.map((item, index) => {
                  const isHovered = activeHoverIndex === index;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleMainMenuClick(item.id)}
                      onMouseEnter={() => {
                        soundFx.playHover();
                        setActiveHoverIndex(index);
                      }}
                      onMouseLeave={() => setActiveHoverIndex(null)}
                      whileTap={{ scale: 0.98 }}
                      className={`relative w-full py-3.5 px-6 text-center text-sm sm:text-base font-bold tracking-[0.25em] transition-all duration-200 rounded border backdrop-blur-md overflow-hidden group ${
                        isHovered
                          ? 'bg-slate-800/80 text-white border-red-600/70 shadow-[0_0_20px_rgba(220,38,38,0.25)]'
                          : 'bg-[#121620]/70 text-slate-300 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 ${
                          isHovered ? 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.9)]' : 'bg-transparent'
                        }`}
                      />

                      <span className="relative z-10 block transition-transform duration-200 group-hover:translate-x-1">
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="difficulty-menu"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="pt-2 w-full max-w-2xl flex flex-col md:flex-row items-start gap-6"
              >
                {/* Left Column: Difficulty Buttons + Geri Dön */}
                <div className="w-full md:w-64 space-y-2.5 flex-shrink-0">
                  {difficultyItems.map((item, index) => {
                    const isHovered = hoveredDifficulty === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => handleDifficultySelect(item.id)}
                        onMouseEnter={() => {
                          soundFx.playHover();
                          setHoveredDifficulty(item.id);
                          setActiveHoverIndex(index);
                        }}
                        onMouseLeave={() => {
                          setHoveredDifficulty(null);
                          setActiveHoverIndex(null);
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative w-full py-3 px-5 text-left text-xs sm:text-sm font-bold tracking-[0.2em] transition-all duration-200 rounded border backdrop-blur-md overflow-hidden group flex items-center justify-between ${
                          isHovered
                            ? 'bg-slate-800/90 text-white border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                            : 'bg-[#121620]/70 text-slate-300 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 ${
                            isHovered ? 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.9)]' : 'bg-transparent'
                          }`}
                        />

                        <div className="flex items-center space-x-3 relative z-10">
                          {item.icon}
                          <span className="transition-transform duration-200 group-hover:translate-x-1 font-cinzel">
                            {item.label}
                          </span>
                        </div>

                        {item.id === 'kabus' && (
                          <span className="text-[9px] font-mono text-red-500 border border-red-900 bg-red-950/80 px-1.5 py-0.5 rounded tracking-normal">
                            {t('extreme', lang)}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}

                  {/* Return Back Button */}
                  <div className="pt-2 border-t border-slate-800/60">
                    <motion.button
                      onClick={() => {
                        soundFx.playClick();
                        setMenuView('main');
                      }}
                      onMouseEnter={() => soundFx.playHover()}
                      whileTap={{ scale: 0.98 }}
                      className="relative w-full py-2.5 px-5 text-center text-xs font-bold tracking-[0.2em] text-slate-400 hover:text-red-400 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-red-900/60 rounded transition-all flex items-center justify-center space-x-2"
                    >
                      <ArrowLeft className="w-4 h-4 text-red-500" />
                      <span>{t('backToMenu', lang)}</span>
                    </motion.button>
                  </div>
                </div>

                {/* Right Column: Dynamic Hover Description Panel */}
                <div className="w-full md:w-80 min-h-[260px]">
                  <AnimatePresence mode="wait">
                    {selectedDiffInfo && (
                      <motion.div
                        key={selectedDiffInfo.id}
                        initial={{ opacity: 0, x: 10, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="p-5 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 rounded-lg shadow-xl backdrop-blur-md space-y-4"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                              {selectedDiffInfo.icon}
                            </div>
                            <span className="font-cinzel font-bold text-sm tracking-widest text-slate-100">
                              {selectedDiffInfo.label} {t('mode', lang)}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-red-400 bg-red-950/60 border border-red-900/60 px-2 py-0.5 rounded uppercase">
                            {t('level', lang)} {selectedDiffInfo.id.toUpperCase()}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 leading-relaxed font-sans-body min-h-[48px]">
                          {selectedDiffInfo.desc}
                        </p>

                        {/* Stats & Features */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/60">
                          <div className="text-[10px] font-cinzel font-bold text-slate-400 tracking-wider">
                            {t('battleParams', lang)}
                          </div>
                          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-900 text-[11px] font-mono text-slate-400 space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-500">{t('enemyDamage', lang)}:</span>
                              <span className="text-red-400 font-bold">
                                {selectedDiffInfo.id === 'kolay' ? '%70' : selectedDiffInfo.id === 'normal' ? '%100' : selectedDiffInfo.id === 'zor' ? '%140' : '%200'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">{t('rewardMultiplier', lang)}:</span>
                              <span className="text-amber-400 font-bold">
                                {selectedDiffInfo.id === 'kolay' ? '1.0x' : selectedDiffInfo.id === 'normal' ? '1.25x' : selectedDiffInfo.id === 'zor' ? '1.75x' : '2.50x'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">{t('aiAggression', lang)}:</span>
                              <span className="text-cyan-400">
                                {selectedDiffInfo.id === 'kolay' ? t('low', lang) : selectedDiffInfo.id === 'normal' ? t('balanced', lang) : selectedDiffInfo.id === 'zor' ? t('high', lang) : t('ruthless', lang)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-sans-body text-center pt-1 italic">
                          {t('clickToConfirm', lang)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Bar: Logo Emblem & Footer Info */}
        <div className="flex items-end justify-between pt-6 border-t border-slate-900/60">
          {/* Bottom Left Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-950 border border-red-900/80 rounded flex flex-col items-center justify-center text-center shadow-lg group hover:border-red-600 transition-colors">
              <span className="text-[10px] font-bold text-red-500 tracking-tighter leading-none">
                KAHYA
              </span>
              <span className="text-[7px] text-red-700 font-sans-body tracking-widest leading-none pt-0.5">
                {t('softwareLabel', lang)}
              </span>
            </div>
          </div>

          {/* Bottom Right Details */}
          <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-sans-body">
            <span className="flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-slate-600" />
              <span>{t('serverActive', lang)}</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="font-mono text-slate-600">v1.0.4</span>
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      <AnimatePresence>
        {menuView === 'wizard' && (
          <NewGameWizard
            language={settings.language}
            onStartGame={handleStartGameFromWizard}
            onBackToMenu={() => setMenuView('main')}
          />
        )}

        {menuView === 'country' && (
          <CountrySelectModal
            difficulty={selectedDifficulty}
            language={settings.language}
            onSelectCountry={handleCountrySelect}
            onBackToDifficulty={() => setMenuView('difficulty')}
          />
        )}

        {activeMenu === 'load_game' && (
          <LoadGameModal
            saveSlots={saveSlots}
            language={settings.language}
            onClose={() => setActiveMenu('none')}
            onLoadGame={handleLoadSave}
            onDeleteSlot={handleDeleteSlot}
            onNewGameClick={() => {
              setActiveMenu('none');
              setMenuView('wizard');
              setHoveredDifficulty(null);
            }}
          />
        )}

        {activeMenu === 'settings' && (
          <SettingsModal
            settings={settings}
            onSave={handleSaveSettings}
            onClose={() => setActiveMenu('none')}
          />
        )}

        {activeMenu === 'quit' && (
          <QuitModal
            language={settings.language}
            onClose={() => setActiveMenu('none')}
            onConfirm={() => {
              setActiveMenu('none');
            }}
          />
        )}

        {/* Screen Transition Spinner */}
        {isScreenTransitioning && (
          <GameLoadingOverlay
            type="screen_transition"
            language={settings.language}
            onFinish={() => setIsScreenTransitioning(false)}
          />
        )}

        {/* New Game Campaign Creation Progress Bar (%0 - %100) */}
        {pendingNewGameParams && (
          <GameLoadingOverlay
            type="new_game"
            language={settings.language}
            countryName={pendingNewGameParams.country.name}
            rulerTitle={pendingNewGameParams.rulerTitle}
            rulerName={pendingNewGameParams.heroName}
            durationSeconds={isFirstGameEntry ? 45 : 20}
            onFinish={finalizeNewGameCreation}
          />
        )}

        {/* Saved Game Load Progress Bar (%0 - %100) */}
        {pendingLoadSlot && (
          <GameLoadingOverlay
            type="new_game"
            language={settings.language}
            countryName={pendingLoadSlot.countryName}
            rulerTitle={pendingLoadSlot.rulerTitle}
            rulerName={pendingLoadSlot.characterName}
            durationSeconds={isFirstGameEntry ? 45 : 20}
            onFinish={finalizeLoadSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
