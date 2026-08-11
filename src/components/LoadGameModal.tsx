import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, Shield, Play, Trash2, Calendar, FileX, Plus, AlertTriangle, Crown, Landmark, Scroll } from 'lucide-react';
import { SaveSlot } from '../types';
import { soundFx } from '../utils/sound';
import { t, getCountryName, Language } from '../utils/i18n';

interface LoadGameModalProps {
  language?: Language;
  saveSlots: SaveSlot[];
  onClose: () => void;
  onLoadGame: (slot: SaveSlot) => void;
  onDeleteSlot: (id: number) => void;
  onNewGameClick: () => void;
}

export const LoadGameModal: React.FC<LoadGameModalProps> = ({
  language = 'Türkçe' as Language,
  saveSlots,
  onClose,
  onLoadGame,
  onDeleteSlot,
  onNewGameClick,
}) => {
  const [slotToDelete, setSlotToDelete] = useState<SaveSlot | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-3xl bg-[#0d111a] border border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-6 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
            <h2 className="text-2xl font-cinzel tracking-widest text-slate-100 font-bold">{t('loadGameTitle', language)}</h2>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-cinzel tracking-wider px-3 py-1.5 rounded bg-slate-800/40 border border-slate-700/50 hover:border-red-500/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('returnToMenu', language)}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-4 flex-1">
          {saveSlots.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-5 bg-slate-950/40 border border-dashed border-slate-800 rounded-lg"
            >
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                <FileX className="w-8 h-8 text-red-500/80" />
              </div>

              <div className="space-y-2 max-w-md">
                <h3 className="text-xl font-cinzel font-bold tracking-widest text-slate-200 uppercase">
                  {t('noSavedGames', language)}
                </h3>
                <p className="text-xs text-slate-400 font-sans-body leading-relaxed">
                  {t('noSavedGamesDesc', language)}
                </p>
              </div>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onNewGameClick();
                }}
                onMouseEnter={() => soundFx.playHover()}
                className="flex items-center space-x-2.5 px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-cinzel font-bold text-xs tracking-widest rounded border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>{t('startNewGame', language)}</span>
              </button>
            </motion.div>
          ) : (
            /* Save Slots List */
            saveSlots.map((slot) => (
              <motion.div
                key={slot.id}
                whileHover={{ scale: 1.01 }}
                className="p-5 bg-slate-900/50 border border-slate-800 hover:border-red-500/60 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-950/80 border border-red-800/60 text-red-400 font-bold">
                      {t('slot', language)} {slot.id}
                    </span>

                    {/* Ruler Title + Character Name */}
                    <h3 className="text-lg font-cinzel font-extrabold text-amber-300 group-hover:text-amber-200 transition-colors tracking-wide flex items-center space-x-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>{slot.rulerTitle ? `${slot.rulerTitle} ${slot.characterName}` : slot.characterName}</span>
                    </h3>

                    {/* Dynasty Name Badge */}
                    {slot.dynastyName && (
                      <span className="text-xs px-2.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300 font-bold flex items-center space-x-1">
                        <Landmark className="w-3 h-3 text-blue-400" />
                        <span>{slot.dynastyName}</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-sans-body px-2 py-0.5 rounded bg-slate-800 ml-auto">
                      {t('turnLabel', language)} {slot.turn || slot.level}
                    </span>
                  </div>

                  {/* Kingdom Oath Banner */}
                  {slot.kingdomOath && (
                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs font-sans-body flex items-center space-x-2">
                      <Scroll className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="italic font-medium">"{slot.kingdomOath}"</span>
                    </div>
                  )}

                  <div className="text-sm text-slate-300 font-cinzel tracking-wider">
                    {slot.countryName
                      ? `${t('chapter', language)}: ${getCountryName(slot.countryName, language)} (${t('turnLabel', language)} ${slot.turn || slot.level})`
                      : slot.chapter}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-sans-body">
                    {slot.countryName && (
                      <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-200">
                        {slot.countryFlag && (
                          <img src={slot.countryFlag} alt={slot.countryName} className="w-4 h-3 object-cover rounded-none" />
                        )}
                        <span className="font-bold">{getCountryName(slot.countryName, language)}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {slot.characterClass === "KRALIN KAHYASI" || slot.characterClass === "KING'S CHANCELLOR" || slot.characterClass === "كاهيا الملك" || slot.characterClass === "Kahya الملك"
                          ? language === 'English' ? "KING'S CHANCELLOR" : language === 'Arapça' ? "Kahya الملك" : "KRALIN KAHYASI"
                          : slot.characterClass} ({slot.difficulty})
                      </span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('turnLabel', language)} {slot.turn || slot.level}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{slot.savedAt}</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <button
                    onClick={() => {
                      soundFx.playStartGame();
                      onLoadGame(slot);
                    }}
                    onMouseEnter={() => soundFx.playHover()}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-red-700/80 hover:bg-red-600 text-white font-cinzel text-xs font-bold tracking-widest rounded border border-red-500/50 shadow-md transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{t('continueGame', language)}</span>
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setSlotToDelete(slot);
                    }}
                    className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded border border-transparent hover:border-slate-700 transition-all"
                    title={t('deleteSave', language)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 font-cinzel tracking-wider">
          <span>{t('totalSaves', language)}: {saveSlots.length} / 10</span>
          <span>{t('saveLogsHeader', language)}</span>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {slotToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-cinzel">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="w-full max-w-md bg-[#0f1420] border-2 border-red-600/80 p-6 rounded-xl shadow-[0_0_40px_rgba(220,38,38,0.35)] space-y-5 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700"></div>

              <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-600/60 flex items-center justify-center text-red-500 shadow-lg">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-100 tracking-wider uppercase">
                  {language === 'English' ? 'Delete Save File?' : language === 'Arapça' ? 'حذف ملف الحفظ؟' : 'Oyun Silinsin mi?'}
                </h3>
                <p className="text-xs text-slate-300 font-sans-body leading-relaxed">
                  {language === 'English'
                    ? `Are you sure you want to delete the save file for "${slotToDelete.characterName}"? This action cannot be undone!`
                    : language === 'Arapça'
                    ? `هل أنت تأكد من أنك تريد حذف حفظ "${slotToDelete.characterName}"؟ لا يمكن التراجع عن هذا الإجراء!`
                    : `"${slotToDelete.characterName}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setSlotToDelete(null);
                  }}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs tracking-wider rounded-lg border border-slate-700 transition font-cinzel cursor-pointer"
                >
                  {language === 'English' ? 'CANCEL' : language === 'Arapça' ? 'إلغاء' : 'İPTAL'}
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onDeleteSlot(slotToDelete.id);
                    setSlotToDelete(null);
                  }}
                  className="py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider rounded-lg border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition font-cinzel cursor-pointer"
                >
                  {language === 'English' ? 'YES, DELETE' : language === 'Arapça' ? 'نعم، حذف' : 'EVET, SİL'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
