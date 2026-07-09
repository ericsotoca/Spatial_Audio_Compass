/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Music, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { SOUND_PRESETS } from '../data';
import { SoundPreset } from '../types';

interface SoundSelectorProps {
  selectedId: string;
  onChangePreset: (id: string) => void;
}

export const SoundSelector: React.FC<SoundSelectorProps> = ({
  selectedId,
  onChangePreset,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div id="sound-selector-card" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Accordion/Card Header */}
      <button
        id="sound-selector-header"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 md:px-8 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Music className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans">
              Choix du Signal Sonore
            </h2>
            <p className="text-sm font-bold text-slate-800 font-sans">Sélectionnez le timbre de stimulation</p>
          </div>
        </div>
        <div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </div>
      </button>

      {/* Accordion Content with Grid */}
      {isOpen && (
        <div id="sound-selector-content" className="p-6 md:p-8 pt-0 border-t border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {SOUND_PRESETS.map((p) => {
              const isSelected = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  id={`preset-${p.id}`}
                  onClick={() => onChangePreset(p.id)}
                  className={`relative text-left p-4 rounded-lg border transition-all duration-300 flex items-start gap-4 cursor-pointer hover:shadow-sm group ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-300/80 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Radio indicator */}
                  <div className="mt-1 flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white scale-105 shadow-sm shadow-indigo-100'
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3.5px]" />}
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className={`text-sm font-bold font-sans tracking-tight ${isSelected ? 'text-indigo-950 font-sans' : 'text-slate-800'}`}>
                        {p.title}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono italic">
                        ({p.subtitle})
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 leading-relaxed font-sans ${isSelected ? 'text-indigo-900/85 font-medium' : 'text-slate-500'}`}>
                      {p.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
