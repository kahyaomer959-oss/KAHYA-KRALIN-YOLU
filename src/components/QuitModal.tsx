import React from 'react';
import { motion } from 'motion/react';
import { LogOut, X, Check } from 'lucide-react';
import { soundFx } from '../utils/sound';
import { t, Language } from '../utils/i18n';

interface QuitModalProps {
  language?: Language;
  onClose: () => void;
  onConfirm: () => void;
}

export const QuitModal: React.FC<QuitModalProps> = ({ language = 'Türkçe' as Language, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md bg-[#0d111a] border border-red-900/60 rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.2)] overflow-hidden p-6 space-y-6 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center mx-auto text-red-500 shadow-inner">
          <LogOut className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-cinzel font-bold text-slate-100 tracking-widest">
            {t('quitTitle', language)}
          </h3>
          <p className="text-xs text-slate-400 font-sans-body leading-relaxed">
            {t('quitAppDesc', language)}
          </p>
        </div>

        <div className="flex items-center space-x-4 pt-2">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            onMouseEnter={() => soundFx.playHover()}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-cinzel text-xs font-bold tracking-widest rounded border border-slate-700 flex items-center justify-center space-x-2 transition-all"
          >
            <X className="w-4 h-4" />
            <span>{t('cancel', language)}</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onConfirm();
            }}
            onMouseEnter={() => soundFx.playHover()}
            className="flex-1 py-3 px-4 bg-red-700 hover:bg-red-600 text-white font-cinzel text-xs font-bold tracking-widest rounded border border-red-500/50 shadow-lg flex items-center justify-center space-x-2 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>{t('confirmQuit', language)}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
