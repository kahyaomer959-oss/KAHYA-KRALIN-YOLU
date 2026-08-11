import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  Globe,
  Shield,
  Check,
  Sparkles,
  Flag,
  Star,
  Users,
  Swords,
  Coins,
  Award,
} from 'lucide-react';
import { WORLD_COUNTRIES, Country, getCountryStats } from '../data/countries';
import { soundFx } from '../utils/sound';
import { t, Language, translateContinent, getCountryName } from '../utils/i18n';

interface CountrySelectModalProps {
  difficulty: string;
  language?: Language;
  onSelectCountry: (country: Country) => void;
  onBackToDifficulty: () => void;
}

const CONTINENT_KEYS = ['all', 'europe', 'asia', 'americas', 'africa', 'oceania'] as const;

export const CountrySelectModal: React.FC<CountrySelectModalProps> = ({
  difficulty,
  language = 'Türkçe' as Language,
  onSelectCountry,
  onBackToDifficulty,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinentKey, setSelectedContinentKey] = useState<string>('all');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('tr');

  // Filter countries
  const filteredCountries = useMemo(() => {
    return WORLD_COUNTRIES.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.officialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.capital.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesContinent = true;
      if (selectedContinentKey !== 'all') {
        const continentName = t(selectedContinentKey as any, language);
        const mappedOrig = translateContinent(c.continent, 'Türkçe');
        matchesContinent = c.continent === mappedOrig || translateContinent(c.continent, language) === continentName;
      }

      return matchesSearch && matchesContinent;
    });
  }, [searchTerm, selectedContinentKey, language]);

  const currentSelectedCountry = useMemo(() => {
    return (
      WORLD_COUNTRIES.find((c) => c.code === selectedCountryCode) || WORLD_COUNTRIES[0]
    );
  }, [selectedCountryCode]);

  const handleCountryClick = (country: Country) => {
    soundFx.playClick();
    setSelectedCountryCode(country.code);
  };

  const handleStartWithCountry = () => {
    soundFx.playStartGame();
    onSelectCountry(currentSelectedCountry);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070a0f] font-cinzel overflow-hidden flex flex-col">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="w-full h-full bg-gradient-to-b from-[#0d111a] via-[#090d15] to-[#05070a] flex flex-col overflow-hidden relative"
      >
        {/* Background glow decorative */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-950/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-950/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-4 z-10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                soundFx.playClick();
                onBackToDifficulty();
              }}
              onMouseEnter={() => soundFx.playHover()}
              className="flex items-center space-x-2 text-xs font-bold tracking-widest text-slate-400 hover:text-red-400 px-3 py-2 rounded bg-slate-900 border border-slate-800 hover:border-red-900/60 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 text-red-500 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">{t('backToDiff', language)}</span>
              <span className="sm:hidden">{t('backShort', language)}</span>
            </button>
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            <div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-red-500" />
                <h2 className="text-base sm:text-lg font-bold tracking-widest text-slate-100">
                  {t('countrySelectTitle', language)}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-sans-body">
                {t('countrySelectSubtitle', language)} ({difficulty.toUpperCase()} {t('mode', language)})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-red-400 bg-red-950/70 border border-red-900/80 px-2.5 py-1 rounded">
              {t('level', language)}: {difficulty.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/60 space-y-3 z-10 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchCountryPlaceholder', language)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 focus:border-red-600 rounded text-xs text-slate-100 placeholder-slate-500 outline-none font-sans-body transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 font-sans-body"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Continent Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
              {CONTINENT_KEYS.map((key) => {
                const isActive = selectedContinentKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedContinentKey(key);
                    }}
                    onMouseEnter={() => soundFx.playHover()}
                    className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-all whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? 'bg-red-700 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)] border border-red-500'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {t(key as any, language)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result Count */}
          <div className="flex items-center justify-between text-[11px] font-sans-body text-slate-400 px-1">
            <span>
              {t('totalCountriesListed', language)}: <strong className="text-slate-200 font-mono">{filteredCountries.length}</strong>
            </span>
            {selectedContinentKey !== 'all' && (
              <span className="text-red-400 font-mono">{t('filter', language)}: {t(selectedContinentKey as any, language)}</span>
            )}
          </div>
        </div>

        {/* Main Content Area (Grid + Active Detail Side panel) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row z-10 min-h-0">
          {/* Countries Grid */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {filteredCountries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-3">
                <Flag className="w-10 h-10 text-slate-600" />
                <p className="text-sm font-sans-body">{t('noCountryFound', language)}</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedContinentKey('all');
                  }}
                  className="text-xs text-red-400 hover:underline font-mono"
                >
                  {t('clearFilters', language)}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredCountries.map((country, idx) => {
                  const isSelected = country.code === selectedCountryCode;
                  const stats = getCountryStats(country);

                  return (
                    <motion.div
                      key={`${country.code}-${idx}`}
                      onClick={() => handleCountryClick(country)}
                      onMouseEnter={() => soundFx.playHover()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between group overflow-hidden ${
                        isSelected
                          ? 'bg-slate-900/90 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.35)] ring-1 ring-red-500/50'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      {/* Selection Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      <div>
                        {/* Flag & Name */}
                        <div className="flex items-center space-x-2.5 mb-2">
                          <div className="w-9 h-6 rounded border border-slate-700/80 overflow-hidden flex-shrink-0 bg-slate-900 shadow-sm">
                            <img
                              src={country.flagUrl}
                              alt={country.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-red-400 transition-colors truncate">
                              {getCountryName(country.code, language)}
                            </h3>
                            <p className="text-[10px] text-slate-400 truncate font-sans-body">
                              {country.capital}
                            </p>
                          </div>
                        </div>

                        {/* Real-world mini stats */}
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 grid grid-cols-2 gap-1 text-[10px] font-sans-body">
                          <div className="flex items-center space-x-1 text-slate-300" title={t('population', language)}>
                            <Users className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                            <span className="truncate">{stats.population}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-300" title={t('activeMilitary', language)}>
                            <Swords className="w-3 h-3 text-red-400 flex-shrink-0" />
                            <span className="truncate">{stats.activeMilitary}</span>
                          </div>
                        </div>

                        {/* Continent Tag */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans-body border-t border-slate-900 pt-1.5 mt-1.5">
                          <span>{translateContinent(country.continent, language)}</span>
                          <span className="font-mono text-slate-400 uppercase">{country.code}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Selected Country Detailed Preview Panel */}
          <div className="w-full md:w-80 bg-slate-950/90 border-t md:border-t-0 md:border-l border-slate-800 p-4 sm:p-5 flex flex-col justify-between flex-shrink-0 z-20 overflow-y-auto">
            <div className="space-y-3.5">
              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('selectedBannerDetails', language)}</span>
              </div>

              {/* Big Flag & Header */}
              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2.5 relative overflow-hidden">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-9 rounded border border-slate-700 overflow-hidden shadow-lg flex-shrink-0 bg-slate-950">
                    <img
                      src={currentSelectedCountry.flagUrl}
                      alt={getCountryName(currentSelectedCountry.code, language)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 font-cinzel">
                      {getCountryName(currentSelectedCountry.code, language)}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans-body">
                      {currentSelectedCountry.officialName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-sans-body">
                      {t('capital', language)}
                    </span>
                    <strong>{currentSelectedCountry.capital}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-sans-body">
                      {t('continent', language)}
                    </span>
                    <strong>{translateContinent(currentSelectedCountry.continent, language)}</strong>
                  </div>
                </div>
              </div>

              {/* Real World Stats Box */}
              {(() => {
                const cStats = getCountryStats(currentSelectedCountry);
                return (
                  <div className="p-3 bg-slate-900/90 border border-slate-800/80 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-1.5">
                      <span className="flex items-center space-x-1.5">
                        <Swords className="w-3.5 h-3.5 text-red-400" />
                        <span>{t('realWorldData', language)}</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/50 rounded">
                        {cStats.militaryRank}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-950/70 p-2 rounded border border-slate-800/60">
                        <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-0.5">
                          <Users className="w-3 h-3 text-cyan-400" />
                          <span>{t('population', language)}</span>
                        </div>
                        <strong className="text-slate-100 font-mono">{cStats.population}</strong>
                      </div>

                      <div className="bg-slate-950/70 p-2 rounded border border-slate-800/60">
                        <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-0.5">
                          <Swords className="w-3 h-3 text-red-400" />
                          <span>{t('activeMilitary', language)}</span>
                        </div>
                        <strong className="text-red-400 font-mono">{cStats.activeMilitary}</strong>
                      </div>

                      <div className="bg-slate-950/70 p-2 rounded border border-slate-800/60">
                        <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-0.5">
                          <Shield className="w-3 h-3 text-blue-400" />
                          <span>{t('reserveMilitary', language)}</span>
                        </div>
                        <strong className="text-slate-200 font-mono">{cStats.reserveMilitary}</strong>
                      </div>

                      <div className="bg-slate-950/70 p-2 rounded border border-slate-800/60">
                        <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-0.5">
                          <Coins className="w-3 h-3 text-amber-400" />
                          <span>{t('defenseBudget', language)}</span>
                        </div>
                        <strong className="text-amber-300 font-mono">{cStats.defenseBudget}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="text-[11px] text-slate-500 font-sans-body space-y-1">
                <div className="flex justify-between">
                  <span>{t('allySupport', language)}:</span>
                  <span className="text-slate-300 font-mono">{t('active', language)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('startingBanner', language)}:</span>
                  <span className="text-red-400 font-mono">{currentSelectedCountry.name}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2 mt-4">
              <button
                onClick={handleStartWithCountry}
                onMouseEnter={() => soundFx.playHover()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs tracking-[0.25em] rounded border border-red-400/50 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center space-x-2 transform active:scale-95"
              >
                <Shield className="w-4 h-4" />
                <span>{t('startGame', language)}</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onBackToDifficulty();
                }}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors font-sans-body"
              >
                {t('backToMenu', language)}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
