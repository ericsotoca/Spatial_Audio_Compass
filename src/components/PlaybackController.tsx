/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Square, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface PlaybackControllerProps {
  playing: boolean;
  onTogglePlay: () => void;
  volume: number; // 0 to 100
  onChangeVolume: (vol: number) => void;
  activePresetTitle: string;
}

export const PlaybackController: React.FC<PlaybackControllerProps> = ({
  playing,
  onTogglePlay,
  volume,
  onChangeVolume,
  activePresetTitle,
}) => {
  return (
    <div id="playback-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
      {/* Label and Subheading */}
      <div>
        <h2 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans">
          Contrôleur de Lecture
        </h2>
        {playing && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-sans">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>Signal actif : <strong className="text-slate-800 font-bold">{activePresetTitle}</strong></span>
          </div>
        )}
      </div>

      {/* Main Play / Stop Button */}
      <div className="flex flex-col sm:flex-row items-stretch gap-4">
        <button
          id="play-sound-btn"
          onClick={onTogglePlay}
          className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-lg text-sm font-bold tracking-wide transition-all cursor-pointer ${
            playing
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm ring-4 ring-rose-50'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-4 ring-emerald-50'
          }`}
        >
          {playing ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>ARRÊTER LE SON</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>DÉMARRER LE SON</span>
            </>
          )}
        </button>

        {/* Volume controls with slider */}
        <div className="w-full sm:w-[220px] flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
          <button
            id="volume-mute-toggle"
            onClick={() => onChangeVolume(volume > 0 ? 0 : 60)}
            className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
          </button>
          
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase font-sans">
              <span>VOL</span>
              <span className="text-indigo-600 font-mono font-bold">{volume}%</span>
            </div>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onChangeVolume(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
