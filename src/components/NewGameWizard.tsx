import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Swords,
  Sparkles,
  Flame,
  Check,
  Crown,
  Scroll,
  Landmark,
  User,
} from 'lucide-react';
import { Country } from '../data/countries';
import { Difficulty } from '../types';
import { soundFx } from '../utils/sound';
import { t, Language } from '../utils/i18n';
import { CountrySelectModal } from './CountrySelectModal';

interface NewGameWizardProps {
  language?: Language;
  onStartGame: (
    heroName: string,
    rulerTitle: string,
    dynastyName: string,
    kingdomOath: string,
    difficulty: Difficulty,
    country: Country
  ) => void;
  onBackToMenu: () => void;
}

export const NewGameWizard: React.FC<NewGameWizardProps> = ({
  language = 'Türkçe',
  onStartGame,
  onBackToMenu,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Ruler Identity & Oath States
  const [heroName, setHeroName] = useState<string>('Kahya Mustafa');
  const [rulerTitle, setRulerTitle] = useState<string>(
    language === 'English' ? 'Sultan' : language === 'Arapça' ? 'سلطان' : 'Sultan'
  );
  const [dynastyName, setDynastyName] = useState<string>(
    language === 'English'
      ? 'House of Osman'
      : language === 'Arapça'
      ? 'السلالة العثمانية'
      : 'Osmanoğulları Hanedanı'
  );
  const [kingdomOath, setKingdomOath] = useState<string>(
    language === 'English'
      ? 'Justice, Liberty, and Eternal Victory!'
      : language === 'Arapça'
      ? 'العدل، الحرية، والمجد الخالد!'
      : 'Adalet, Hürriyet ve Ebedi Zafer!'
  );

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [hoveredDifficulty, setHoveredDifficulty] = useState<Difficulty | null>(null);

  // Title suggestions based on language
  const titleSuggestions = useMemo(() => {
    if (language === 'English') {
      return ['Sultan', 'King', 'Emperor', 'Khan', 'Shah', 'President', 'Lord'];
    }
    if (language === 'Arapça') {
      return ['سلطان', 'ملك', 'إمبراطور', 'خاقان', 'شاه', 'رئيس'];
    }
    return ['Sultan', 'Kral', 'İmparator', 'Kaan', 'Şah', 'Başkan', 'Hakan'];
  }, [language]);

  // Name suggestions based on language
  const nameSuggestions = useMemo(() => {
    if (language === 'English') {
      return ['Chancellor Mustafa', 'Alexander', 'Suleiman', 'Justinian', 'Richard'];
    }
    if (language === 'Arapça') {
      return ['Kahya Mustafa', 'سليمان', 'ألب أرسلان', 'صلاح الدين', 'الظاهر'];
    }
    return ['Kahya Mustafa', 'Sultan Süleyman', 'Alparslan', 'Fatih Sultan', 'Barbaros Hayrettin'];
  }, [language]);

  // Dynasty suggestions
  const dynastySuggestions = useMemo(() => {
    if (language === 'English') {
      return ['House of Osman', 'Imperial Dynasty', 'House of Seljuk', 'Golden Realm Dynasty'];
    }
    if (language === 'Arapça') {
      return ['السلالة العثمانية', 'سلالة الشرق العظيم', 'السلالة السلجوقية', 'سلالة العرش الذهبي'];
    }
    return ['Osmanoğulları Hanedanı', 'Büyük Doğu Soyu', 'Selçuklu Hanedanı', 'Altın Otağ Hanedanı'];
  }, [language]);

  // Oath Presets
  const oathPresets = useMemo(() => {
    if (language === 'English') {
      return [
        'Justice, Liberty, and Eternal Victory!',
        'My Sword is my People\'s Shield, my Throne is the Beacon of Justice!',
        'For the Eternal Glory and Preservation of our Sovereign State!',
        'For the People, for the Realm, for Unity and Triumph!',
      ];
    }
    if (language === 'Arapça') {
      return [
        'العدل، الحرية، والمجد الخالد!',
        'سيفي درعٌ لشعبي، وعرشي منارٌ للعدالة!',
        'من أجل العزة الخالدة وبقاء الدولة!',
        'للشعب، للوطن، للوحدة والانتصار!',
      ];
    }
    return [
      'Adalet, Hürriyet ve Ebedi Zafer!',
      'Kılıcım Halkımın Siperidir, Tahtım Adaletin Simgesidir!',
      'Cihan Şanımız ve Devletimizin Bekası İçin!',
      'Halk İçin, Vatan İçin, Birlik ve Güç İçin!',
    ];
  }, [language]);

  const difficultyItems: {
    id: Difficulty;
    label: string;
    desc: string;
    icon: React.ReactNode;
    colorClass: string;
    stats: string;
  }[] = [
    {
      id: 'kolay',
      label: t('easy', language),
      desc: t('easyDesc', language),
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      colorClass: 'hover:border-emerald-500/70 text-emerald-300',
      stats: `${t('enemyDamage', language)}: %70 | ${t('rewardMultiplier', language)}: 1.0x`,
    },
    {
      id: 'normal',
      label: t('normal', language),
      desc: t('normalDesc', language),
      icon: <Swords className="w-5 h-5 text-blue-400" />,
      colorClass: 'hover:border-blue-500/70 text-blue-300',
      stats: `${t('enemyDamage', language)}: %100 | ${t('rewardMultiplier', language)}: 1.25x`,
    },
    {
      id: 'zor',
      label: t('hard', language),
      desc: t('hardDesc', language),
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      colorClass: 'hover:border-amber-500/70 text-amber-300',
      stats: `${t('enemyDamage', language)}: %140 | ${t('rewardMultiplier', language)}: 1.75x`,
    },
    {
      id: 'kabus',
      label: t('nightmare', language),
      desc: t('nightmareDesc', language),
      icon: <Flame className="w-5 h-5 text-red-500" />,
      colorClass: 'hover:border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] text-red-400',
      stats: `${t('enemyDamage', language)}: %200 | ${t('rewardMultiplier', language)}: 2.50x`,
    },
  ];

  const handleNextFromStep1 = () => {
    if (!heroName.trim()) return;
    soundFx.playClick();
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    soundFx.playClick();
    setStep(3);
  };

  // If step 3, show the full original CountrySelectModal screen
  if (step === 3) {
    return (
      <CountrySelectModal
        difficulty={selectedDifficulty}
        language={language}
        onSelectCountry={(country) => {
          const finalHeroName = heroName.trim() || 'Kahya Mustafa';
          const finalTitle = rulerTitle.trim() || 'Sultan';
          const finalDynasty = dynastyName.trim() || 'Osmanoğulları Hanedanı';
          const finalOath = kingdomOath.trim() || 'Adalet, Hürriyet ve Ebedi Zafer!';
          onStartGame(finalHeroName, finalTitle, finalDynasty, finalOath, selectedDifficulty, country);
        }}
        onBackToDifficulty={() => setStep(2)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#070a0f] font-cinzel text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Background glow decorative */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Wizard Header Bar */}
      <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-4 z-20 flex-shrink-0 backdrop-blur-md">
        {/* Left: Back */}
        <button
          onClick={() => {
            soundFx.playClick();
            if (step > 1) {
              setStep((prev) => (prev - 1) as 1 | 2);
            } else {
              onBackToMenu();
            }
          }}
          onMouseEnter={() => soundFx.playHover()}
          className="flex items-center space-x-2 text-xs font-bold tracking-widest text-slate-400 hover:text-red-400 px-3.5 py-2 rounded bg-slate-900/90 border border-slate-800 hover:border-red-900/60 transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-red-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>{step === 1 ? t('backToMenu', language) : t('prevStep', language)}</span>
        </button>

        {/* Center: Stepper Header */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Step 1 Indicator */}
          <div
            onClick={() => {
              soundFx.playClick();
              setStep(1);
            }}
            className={`flex items-center space-x-2.5 cursor-pointer px-3 py-1.5 rounded transition-all ${
              step === 1
                ? 'bg-red-950/50 border border-red-600/70 text-red-200'
                : step > 1
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-slate-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1
                  ? 'bg-red-600 text-white'
                  : step > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </div>
            <span className="text-xs font-bold tracking-wider">
              {t('rulerIdentitySummary', language)}
            </span>
          </div>

          <div className="w-6 h-[1px] bg-slate-800" />

          {/* Step 2 Indicator */}
          <div
            onClick={() => {
              if (heroName.trim()) {
                soundFx.playClick();
                setStep(2);
              }
            }}
            className={`flex items-center space-x-2.5 cursor-pointer px-3 py-1.5 rounded transition-all ${
              step === 2
                ? 'bg-red-950/50 border border-red-600/70 text-red-200'
                : step > 2
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-slate-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2
                  ? 'bg-red-600 text-white'
                  : step > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
            </div>
            <span className="text-xs font-bold tracking-wider">{t('stepDifficulty', language)}</span>
          </div>

          <div className="w-6 h-[1px] bg-slate-800" />

          {/* Step 3 Indicator */}
          <div
            onClick={() => {
              if (heroName.trim()) {
                soundFx.playClick();
                setStep(3);
              }
            }}
            className={`flex items-center space-x-2.5 cursor-pointer px-3 py-1.5 rounded transition-all ${
              step === 3
                ? 'bg-red-950/50 border border-red-600/70 text-red-200'
                : 'text-slate-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 3 ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </div>
            <span className="text-xs font-bold tracking-wider">{t('stepCountry', language)}</span>
          </div>
        </div>

        {/* Right: Step Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold tracking-widest text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded">
            {step} / 3
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative p-4 sm:p-8 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* STEP 1: RULER IDENTITY & KINGDOM OATH */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl mx-auto space-y-6 my-auto py-4"
            >
              {/* Card Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-red-950/40 border border-red-800/60 text-red-400 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                  <Crown className="w-8 h-8" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[0.15em] text-metallic">
                  {t('rulerIdentityTitle', language)}
                </h2>

                <p className="text-xs text-slate-400 font-sans-body max-w-md mx-auto leading-relaxed">
                  {language === 'English'
                    ? 'Define the ruler title, name, dynasty, and kingdom oath that will guide your empire.'
                    : language === 'Arapça'
                    ? 'حدد لقب الحاكم واسمه وسلالته وقسم المملكة الذي سيرشد إمبراطوريتك.'
                    : 'Devletinize yön verecek hükümdar unvanını, adını, hanedanını ve kutsal krallık yemininizi belirleyin.'}
                </p>
              </div>

              {/* Identity & Oath Form Box */}
              <div className="bg-[#0f1420]/90 border border-slate-800 p-5 sm:p-7 rounded-xl backdrop-blur-md shadow-2xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />

                {/* Grid 1: Title & Hero Name */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Ruler Title */}
                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="flex items-center space-x-1.5 text-xs font-bold tracking-widest text-amber-400 uppercase">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('rulerTitleLabel', language)}</span>
                    </label>

                    <input
                      type="text"
                      maxLength={16}
                      value={rulerTitle}
                      onChange={(e) => setRulerTitle(e.target.value)}
                      placeholder={t('rulerTitlePlaceholder', language)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-100 placeholder-slate-600 outline-none transition-all"
                    />

                    {/* Quick Title Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {titleSuggestions.map((tItem) => (
                        <button
                          key={tItem}
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setRulerTitle(tItem);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                            rulerTitle === tItem
                              ? 'bg-amber-950/70 border-amber-600 text-amber-300 font-bold'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {tItem}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ruler / Character Name */}
                  <div className="sm:col-span-8 space-y-1.5">
                    <label className="flex items-center space-x-1.5 text-xs font-bold tracking-widest text-slate-300 uppercase">
                      <User className="w-3.5 h-3.5 text-red-400" />
                      <span>{t('enterPlayerName', language)}</span>
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        autoFocus
                        maxLength={32}
                        value={heroName}
                        onChange={(e) => setHeroName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && heroName.trim()) {
                            handleNextFromStep1();
                          }
                        }}
                        placeholder={t('playerNamePlaceholder', language)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-lg px-3.5 py-2.5 text-sm sm:text-base font-bold tracking-wider text-slate-100 placeholder-slate-600 outline-none transition-all shadow-inner"
                      />
                      <div className="absolute right-3 top-2.5 text-xs text-slate-500 font-sans-body">
                        {heroName.length} / 32
                      </div>
                    </div>

                    {/* Quick Name Suggestions */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {nameSuggestions.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setHeroName(name);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                            heroName === name
                              ? 'bg-red-950/70 border-red-600 text-red-200 font-bold'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dynasty / House Name Field */}
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-1.5 text-xs font-bold tracking-widest text-blue-300 uppercase">
                    <Landmark className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('dynastyNameLabel', language)}</span>
                  </label>

                  <input
                    type="text"
                    maxLength={36}
                    value={dynastyName}
                    onChange={(e) => setDynastyName(e.target.value)}
                    placeholder={t('dynastyNamePlaceholder', language)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-lg px-3.5 py-2 text-sm font-bold text-slate-100 placeholder-slate-600 outline-none transition-all"
                  />

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dynastySuggestions.map((dyn) => (
                      <button
                        key={dyn}
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          setDynastyName(dyn);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                          dynastyName === dyn
                            ? 'bg-blue-950/70 border-blue-600 text-blue-300 font-bold'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {dyn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kingdom Oath (Krallık Yemini) Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-1.5 text-xs font-bold tracking-widest text-emerald-300 uppercase">
                      <Scroll className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('kingdomOathLabel', language)}</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-sans-body">
                      {t('kingdomOathDesc', language)}
                    </span>
                  </div>

                  <input
                    type="text"
                    maxLength={80}
                    value={kingdomOath}
                    onChange={(e) => setKingdomOath(e.target.value)}
                    placeholder={t('kingdomOathPlaceholder', language)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-emerald-200 placeholder-slate-600 outline-none transition-all"
                  />

                  {/* Preset Oath Pills */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('presetOathsTitle', language)}:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {oathPresets.map((oathText) => (
                        <button
                          key={oathText}
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setKingdomOath(oathText);
                          }}
                          className={`text-[10px] text-left px-2.5 py-1.5 rounded border transition-all line-clamp-2 cursor-pointer font-sans-body ${
                            kingdomOath === oathText
                              ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200 font-bold'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          "{oathText}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next Step Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    disabled={!heroName.trim()}
                    onClick={handleNextFromStep1}
                    onMouseEnter={() => soundFx.playHover()}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded-lg font-bold tracking-[0.2em] text-sm flex items-center justify-center space-x-3 transition-all ${
                      heroName.trim()
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    }`}
                  >
                    <span>{t('nextStep', language)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: DIFFICULTY SELECTION */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl mx-auto space-y-8 my-auto"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-red-950/40 border border-red-800/60 text-red-400 shadow-[0_0_20px_rgba(220,38,38,0.2)] mb-2">
                  <Swords className="w-10 h-10" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[0.15em] text-metallic">
                  {t('subtitleDiff', language)}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-sans-body">
                  {rulerTitle} {heroName} ({dynastyName})
                </p>
              </div>

              {/* Grid of Difficulty Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {difficultyItems.map((item) => {
                  const isSelected = selectedDifficulty === item.id;
                  const isHovered = hoveredDifficulty === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedDifficulty(item.id);
                      }}
                      onMouseEnter={() => {
                        soundFx.playHover();
                        setHoveredDifficulty(item.id);
                      }}
                      onMouseLeave={() => setHoveredDifficulty(null)}
                      className={`relative p-5 rounded-xl border transition-all cursor-pointer overflow-hidden backdrop-blur-md flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900/90 border-red-600 shadow-[0_0_25px_rgba(220,38,38,0.3)] ring-1 ring-red-600'
                          : isHovered
                          ? 'bg-slate-900/60 border-slate-600 text-slate-200'
                          : 'bg-[#0f1420]/70 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded bg-slate-950 border border-slate-800">
                            {item.icon}
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold tracking-wider">{item.label}</h3>
                            <span className="text-[11px] text-slate-400 font-sans-body">{item.stats}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 font-sans-body pt-3 leading-relaxed border-t border-slate-800/60 mt-3">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Step Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setStep(1);
                  }}
                  onMouseEnter={() => soundFx.playHover()}
                  className="px-6 py-3 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 font-bold text-xs tracking-widest transition-all cursor-pointer"
                >
                  {t('prevStep', language)}
                </button>

                <button
                  onClick={handleNextFromStep2}
                  onMouseEnter={() => soundFx.playHover()}
                  className="px-8 py-3.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold tracking-[0.2em] text-sm flex items-center space-x-3 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
                >
                  <span>{t('nextStep', language)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
