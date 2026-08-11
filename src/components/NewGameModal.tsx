import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Sword, User, Flame, ArrowLeft, Play } from 'lucide-react';
import { CharacterClass, Difficulty } from '../types';
import { soundFx } from '../utils/sound';

interface NewGameModalProps {
  onClose: () => void;
  onStartGame: (name: string, characterClass: CharacterClass, difficulty: Difficulty) => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({ onClose, onStartGame }) => {
  const [playerName, setPlayerName] = useState('KAHYA LORDU');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('kahya');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');

  const classes: { id: CharacterClass; name: string; icon: React.ReactNode; desc: string; stats: string }[] = [
    {
      id: 'kahya',
      name: 'KRALIN KAHYASI',
      icon: <CrownIcon className="w-6 h-6 text-amber-400" />,
      desc: 'Sarayın gizli efendisi. Strateji, diplomasi ve krallığın sırlarına hakim usta.',
      stats: 'Güç: 85 | Zeka: 95 | Savunma: 90',
    },
    {
      id: 'savasci',
      name: 'ŞÖVALYE SAVAŞÇI',
      icon: <Sword className="w-6 h-6 text-red-500" />,
      desc: 'Ağır zırhı ve dev kılıcıyla cephenin en önünde savaşan sarsılmaz muhafız.',
      stats: 'Güç: 98 | Zeka: 60 | Savunma: 95',
    },
    {
      id: 'buyucu',
      name: 'KADİM BÜYÜCÜ',
      icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
      desc: 'Elementlerin gücünü ve gizemli efsunları yöneten yıkıcı büyü ustası.',
      stats: 'Güç: 50 | Zeka: 100 | Savunma: 55',
    },
    {
      id: 'golge',
      name: 'GÖLGE SUİKASTÇI',
      icon: <Flame className="w-6 h-6 text-purple-400" />,
      desc: 'Karanlığa bürünen, hızlı ve ölümcül kritik vuruşlar yapan gizli avcı.',
      stats: 'Güç: 90 | Zeka: 75 | Savunma: 60',
    },
  ];

  const difficulties: { id: Difficulty; label: string; desc: string; color: string }[] = [
    { id: 'kolay', label: 'KOLAY', desc: 'Hikayeye odaklanmak isteyenler için hafif mücadele.', color: 'border-emerald-500/50 text-emerald-400' },
    { id: 'normal', label: 'NORMAL', desc: 'Dengeli düşmanlar ve standart krallık deneyimi.', color: 'border-blue-500/50 text-blue-400' },
    { id: 'zor', label: 'ZOR', desc: 'Zorlu taktiksel savaşlar ve sınırlı kaynaklar.', color: 'border-amber-500/50 text-amber-400' },
    { id: 'kabus', label: 'KABUS', desc: 'Hata affetmeyen acımasız düşmanlar ve kalıcı ölüm riski.', color: 'border-red-600 text-red-500' },
  ];

  const handleStart = () => {
    soundFx.playStartGame();
    onStartGame(playerName || 'KAHYA', selectedClass, selectedDifficulty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-4xl bg-[#0d111a] border border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-6 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
            <h2 className="text-2xl font-cinzel tracking-widest text-slate-100 font-bold">YENİ MACERA BAŞLAT</h2>
          </div>
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-cinzel tracking-wider px-3 py-1.5 rounded bg-slate-800/40 border border-slate-700/50 hover:border-red-500/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>MENÜYE DÖN</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-8 flex-1">
          {/* Character Name */}
          <div className="space-y-2">
            <label className="text-xs font-cinzel tracking-widest text-slate-400 uppercase flex items-center space-x-2">
              <User className="w-4 h-4 text-red-500" />
              <span>Kahraman İsmi</span>
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-red-500 focus:outline-none rounded px-4 py-3 text-slate-100 font-cinzel tracking-widest text-lg shadow-inner"
              placeholder="Kahramanın adını girin..."
            />
          </div>

          {/* Class Selection */}
          <div className="space-y-3">
            <label className="text-xs font-cinzel tracking-widest text-slate-400 uppercase flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span>Sınıf Seçimi</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classes.map((cls) => {
                const isSelected = selectedClass === cls.id;
                return (
                  <div
                    key={cls.id}
                    onClick={() => { soundFx.playClick(); setSelectedClass(cls.id); }}
                    onMouseEnter={() => soundFx.playHover()}
                    className={`cursor-pointer p-5 rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-950/40 to-slate-900 border-red-500/80 shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      {cls.icon}
                      <h3 className={`font-cinzel tracking-wider font-bold ${isSelected ? 'text-red-400' : 'text-slate-200'}`}>
                        {cls.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3 font-sans-body">
                      {cls.desc}
                    </p>
                    <div className="text-[11px] font-mono text-slate-500 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800">
                      {cls.stats}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-3">
            <label className="text-xs font-cinzel tracking-widest text-slate-400 uppercase flex items-center space-x-2">
              <Flame className="w-4 h-4 text-red-500" />
              <span>Zorluk Seviyesi</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {difficulties.map((diff) => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    onClick={() => { soundFx.playClick(); setSelectedDifficulty(diff.id); }}
                    onMouseEnter={() => soundFx.playHover()}
                    className={`p-3 rounded border text-left transition-all ${
                      isSelected
                        ? `bg-slate-900 ${diff.color} shadow-[0_0_12px_rgba(220,38,38,0.2)] font-bold`
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-cinzel text-sm tracking-widest mb-1">{diff.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight font-sans-body">{diff.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-cinzel tracking-wider">
            KRALIN YOLU - SEFER I
          </div>
          <button
            onClick={handleStart}
            onMouseEnter={() => soundFx.playHover()}
            className="flex items-center space-x-3 px-8 py-3.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-cinzel font-bold text-base tracking-widest rounded border border-red-500/40 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>OYUNU BAŞLAT</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const CrownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 20h18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
