import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Crown, Sparkles, Loader2, Compass } from 'lucide-react';
import { Language } from '../utils/i18n';

interface GameLoadingOverlayProps {
  type: 'new_game' | 'screen_transition';
  language?: Language;
  countryName?: string;
  rulerTitle?: string;
  rulerName?: string;
  durationSeconds?: number;
  onFinish?: () => void;
}

export const GameLoadingOverlay: React.FC<GameLoadingOverlayProps> = ({
  type,
  language = 'Türkçe',
  countryName,
  rulerTitle,
  rulerName,
  durationSeconds = 30,
  onFinish,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');

  // Percentage Progress Bar Simulation over durationSeconds
  useEffect(() => {
    if (type !== 'new_game') return;

    const targetSeconds = durationSeconds > 0 ? durationSeconds : 30;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const rawProgress = Math.min(100, Math.floor((elapsed / targetSeconds) * 100));
      setProgress(rawProgress);

      // Dynamic step status messages based on percentage
      if (rawProgress < 20) {
        setCurrentStepText(
          language === 'English'
            ? 'Registering Ruler Identity & Kingdom Oath...'
            : language === 'Arapça'
            ? 'تسجيل هُوية الحاكم وقسم المملكة...'
            : 'Hükümdar Kimliği ve Krallık Yemini Kaydediliyor...'
        );
      } else if (rawProgress < 45) {
        setCurrentStepText(
          language === 'English'
            ? 'Loading World Map & Province Borders...'
            : language === 'Arapça'
            ? 'تحميل خريطة العالم وحدود المقاطعات...'
            : 'Dünya Haritası ve Eyalet Sınırları Yükleniyor...'
        );
      } else if (rawProgress < 75) {
        setCurrentStepText(
          language === 'English'
            ? 'Initializing Treasury, Military & Trade Engines...'
            : language === 'Arapça'
            ? 'إعداد الخزينة، الجيش ومحرك التجارة...'
            : 'Devlet Hazinesi, Ordu ve Ticaret Motoru Hazırlanıyor...'
        );
      } else if (rawProgress < 95) {
        setCurrentStepText(
          language === 'English'
            ? 'Synchronizing AI Warfare & Alliance Systems...'
            : language === 'Arapça'
            ? 'مزامنة الذكاء الاصطناعي للحرب والتحالفات...'
            : 'Savaş ve İttifak Yapay Zekası Senkronize Ediliyor...'
        );
      } else {
        setCurrentStepText(
          language === 'English'
            ? 'Campaign Ready! Entering Realm...'
            : language === 'Arapça'
            ? 'الحملة جاهزة! جاري دخول المملكة...'
            : 'Sefer Başlatıldı! Krallık Haritasına Giriliyor...'
        );
      }

      if (elapsed >= targetSeconds) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          if (onFinish) onFinish();
        }, 300);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [type, language, durationSeconds, onFinish]);

  // Screen Transition Timer
  useEffect(() => {
    if (type !== 'screen_transition') return;

    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 450);

    return () => clearTimeout(timer);
  }, [type, onFinish]);

  if (type === 'screen_transition') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center font-cinzel text-slate-100 select-none"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-red-600/40 border-t-red-500 animate-spin" />
            <Compass className="w-8 h-8 text-amber-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-[0.3em] text-slate-300 uppercase">
            {language === 'English'
              ? 'LOADING...'
              : language === 'Arapça'
              ? 'جاري التحميل...'
              : 'YÜKLENİYOR...'}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-[#05070c] backdrop-blur-xl flex flex-col items-center justify-center font-cinzel text-slate-100 p-6 select-none overflow-hidden"
    >
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-amber-950/15 rounded-full blur-[90px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-8 text-center relative z-10">
        {/* Crest & Title Header */}
        <div className="space-y-3 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-b from-red-950 to-slate-950 border-2 border-red-600/80 shadow-[0_0_40px_rgba(220,38,38,0.4)] flex items-center justify-center relative group"
          >
            <Crown className="w-10 h-10 text-amber-400 animate-pulse" />
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-ping" />
          </motion.div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[0.2em] text-metallic uppercase">
              {countryName
                ? language === 'English'
                  ? `${countryName} Campaign`
                  : language === 'Arapça'
                  ? `حملة ${countryName}`
                  : `${countryName} Seferi`
                : language === 'English'
                ? 'Creating Campaign'
                : language === 'Arapça'
                ? 'إنشاء الحملة'
                : 'Yeni Sefer Oluşturuluyor'}
            </h2>
            {rulerName && (
              <p className="text-xs text-amber-300/90 font-bold tracking-widest uppercase">
                {rulerTitle ? `${rulerTitle} ` : ''}
                {rulerName}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar (%0 - %100) */}
        <div className="space-y-3 bg-[#0d121d]/80 border border-slate-800/90 p-6 rounded-2xl backdrop-blur-md shadow-2xl">
          {/* Percentage display */}
          <div className="flex items-center justify-between text-xs font-bold tracking-widest text-slate-300">
            <span className="flex items-center space-x-2 text-red-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="uppercase font-sans-body">{currentStepText}</span>
            </span>
            <span className="text-xl font-extrabold text-amber-400 font-mono tracking-normal">
              %{progress}
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-4 bg-slate-950 rounded-full border border-slate-800 p-0.5 overflow-hidden relative shadow-inner">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.15 }}
              className="h-full bg-gradient-to-r from-red-700 via-amber-500 to-red-500 rounded-full relative shadow-[0_0_15px_rgba(245,158,11,0.6)]"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-sans-body">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
