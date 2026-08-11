import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Volume2, Monitor, Gamepad2, Check, RotateCcw } from 'lucide-react';
import { GameSettings } from '../types';
import { soundFx } from '../utils/sound';
import { t } from '../utils/i18n';

interface SettingsModalProps {
  settings: GameSettings;
  onSave: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'graphics' | 'gameplay'>('graphics');
  const [currentSettings, setCurrentSettings] = useState<GameSettings>({ ...settings });
  const [, setForceUpdate] = useState(0);

  const handleApply = () => {
    soundFx.playClick();
    soundFx.soundEnabled = currentSettings.soundEnabled;
    onSave(currentSettings);
    onClose();
  };

  const lang = currentSettings.language;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-3xl bg-[#0d111a] border border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-6 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
            <h2 className="text-2xl font-cinzel tracking-widest text-slate-100 font-bold">{t('settingsTitle', lang)}</h2>
          </div>
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-cinzel tracking-wider px-3 py-1.5 rounded bg-slate-800/40 border border-slate-700/50 hover:border-red-500/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('close', lang)}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-8 pt-3 space-x-4">
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('graphics'); }}
            className={`pb-3 px-4 font-cinzel text-xs tracking-widest font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'graphics'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>{t('graphicsTab', lang)}</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('audio'); }}
            className={`pb-3 px-4 font-cinzel text-xs tracking-widest font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'audio'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{t('audioTab', lang)}</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('gameplay'); }}
            className={`pb-3 px-4 font-cinzel text-xs tracking-widest font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'gameplay'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>{t('gameplayTab', lang)}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 font-sans-body">
          {activeTab === 'graphics' && (
            <div className="space-y-6">
              {/* Resolution */}
              <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded">
                <div>
                  <div className="font-cinzel text-sm font-bold text-slate-200">{t('resolution', lang)}</div>
                  <div className="text-xs text-slate-400">{t('resolutionDesc', lang)}</div>
                </div>
                <select
                  value={currentSettings.resolution}
                  onChange={(e) => setCurrentSettings({ ...currentSettings, resolution: e.target.value as any })}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-red-500"
                >
                  <option value="1920x1080">1920 x 1080 (FHD)</option>
                  <option value="2560x1440">2560 x 1440 (QHD)</option>
                  <option value="3840x2160">3840 x 2160 (4K UHD)</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded cursor-pointer hover:border-slate-700">
                  <span className="font-cinzel text-sm text-slate-200 font-bold">{t('fullscreen', lang)}</span>
                  <input
                    type="checkbox"
                    checked={currentSettings.fullscreen}
                    onChange={(e) => setCurrentSettings({ ...currentSettings, fullscreen: e.target.checked })}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded cursor-pointer hover:border-slate-700">
                  <span className="font-cinzel text-sm text-slate-200 font-bold">{t('vsync', lang)}</span>
                  <input
                    type="checkbox"
                    checked={currentSettings.vsync}
                    onChange={(e) => setCurrentSettings({ ...currentSettings, vsync: e.target.checked })}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded cursor-pointer hover:border-slate-700 sm:col-span-2">
                  <span className="font-cinzel text-sm text-slate-200 font-bold">{t('ambientParticles', lang)}</span>
                  <input
                    type="checkbox"
                    checked={currentSettings.ambientParticles}
                    onChange={(e) => setCurrentSettings({ ...currentSettings, ambientParticles: e.target.checked })}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Sound Enabled */}
              <label className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded cursor-pointer">
                <div>
                  <div className="font-cinzel text-sm font-bold text-slate-200">{t('soundEnabled', lang)}</div>
                  <div className="text-xs text-slate-400">{t('soundEnabledDesc', lang)}</div>
                </div>
                <input
                  type="checkbox"
                  checked={currentSettings.soundEnabled}
                  onChange={(e) => setCurrentSettings({ ...currentSettings, soundEnabled: e.target.checked })}
                  className="w-5 h-5 accent-red-600 rounded"
                />
              </label>

              {/* Master Volume */}
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded space-y-2">
                <div className="flex justify-between font-cinzel text-xs text-slate-300">
                  <span>{t('masterVolume', lang)}</span>
                  <span className="font-mono text-red-400">{currentSettings.masterVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentSettings.masterVolume}
                  onChange={(e) => setCurrentSettings({ ...currentSettings, masterVolume: Number(e.target.value) })}
                  className="w-full accent-red-600 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Music Volume */}
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded space-y-2">
                <div className="flex justify-between font-cinzel text-xs text-slate-300">
                  <span>{t('musicVolume', lang)}</span>
                  <span className="font-mono text-red-400">{currentSettings.musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentSettings.musicVolume}
                  onChange={(e) => setCurrentSettings({ ...currentSettings, musicVolume: Number(e.target.value) })}
                  className="w-full accent-red-600 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded space-y-2">
                <div className="flex justify-between font-cinzel text-xs text-slate-300">
                  <span>{t('sfxVolume', lang)}</span>
                  <span className="font-mono text-red-400">{currentSettings.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentSettings.sfxVolume}
                  onChange={(e) => setCurrentSettings({ ...currentSettings, sfxVolume: Number(e.target.value) })}
                  className="w-full accent-red-600 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Background Music Selection & Upload */}
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded space-y-3">
                <div>
                  <div className="font-cinzel text-sm font-bold text-slate-200">{t('bgMusicSelect', lang)}</div>
                  <div className="text-xs text-slate-400">{t('bgMusicSelectDesc', lang)}</div>
                </div>

                {/* Preset List */}
                <div className="grid grid-cols-1 gap-2">
                  {soundFx.musicPresets.map((preset) => {
                    const isSelected = soundFx.customMusicUrl === preset.url;
                    return (
                      <button
                        key={preset.url}
                        onClick={() => {
                          soundFx.setCustomMusic(preset.url);
                          soundFx.playSuccess();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-cinzel transition-colors ${
                          isSelected
                            ? 'bg-red-950/80 border border-red-500 text-white font-bold'
                            : 'bg-slate-950/60 border border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>🎵 {preset.name}</span>
                        {isSelected && <span className="text-emerald-400 font-mono text-[10px]">{t('active', lang)}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  <label className="flex-1 flex items-center justify-center px-4 py-2.5 bg-slate-950 border border-slate-700 hover:border-red-500 rounded text-xs font-cinzel text-slate-200 cursor-pointer transition-colors">
                    <span>📁 {t('uploadMusic', lang)}</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          soundFx.addCustomMusic(file);
                          setForceUpdate(n => n + 1);
                          soundFx.playSuccess();
                        }
                      }}
                    />
                  </label>
                  {soundFx.customMusicUrl && (
                    <button
                      onClick={() => {
                        soundFx.setCustomMusic(null);
                        soundFx.playClick();
                      }}
                      className="px-3 py-2.5 bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900/60 rounded text-xs font-cinzel"
                    >
                      {t('reset', lang)}
                    </button>
                  )}
                </div>
                {soundFx.customMusicUrl && (
                  <div className="text-[11px] text-emerald-400 font-mono">
                    {t('activeMusic', lang)}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gameplay' && (
            <div className="space-y-6">
              {/* Language */}
              <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded">
                <div>
                  <div className="font-cinzel text-sm font-bold text-slate-200">{t('language', lang)}</div>
                  <div className="text-xs text-slate-400">{t('languageDesc', lang)}</div>
                </div>
                <div className="flex space-x-2">
                  {(['Türkçe', 'English', 'Arapça'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setCurrentSettings({ ...currentSettings, language: l })}
                      className={`px-4 py-1.5 rounded text-xs font-cinzel tracking-wider ${
                        currentSettings.language === l
                          ? 'bg-red-700 text-white font-bold border border-red-500'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={() => {
              soundFx.playClick();
              setCurrentSettings({
                masterVolume: 80,
                musicVolume: 70,
                sfxVolume: 85,
                soundEnabled: true,
                graphicsQuality: 'Yüksek',
                resolution: '1920x1080',
                fullscreen: false,
                vsync: true,
                ambientParticles: true,
                language: 'Türkçe',
              });
            }}
            className="flex items-center space-x-2 text-xs font-cinzel tracking-wider text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('backToDefaults', lang)}</span>
          </button>

          <button
            onClick={handleApply}
            onMouseEnter={() => soundFx.playHover()}
            className="flex items-center space-x-2 px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white font-cinzel font-bold text-xs tracking-widest rounded border border-red-500/40 shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>{t('saveAndApply', lang)}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
