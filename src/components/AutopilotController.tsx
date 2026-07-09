/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, Compass } from 'lucide-react';
import { TRAJECTORIES } from '../data';
import { TrajectoryType } from '../types';

interface AutopilotControllerProps {
  selectedType: TrajectoryType;
  onChangeType: (type: TrajectoryType) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  autopilotActive: boolean;
  setAutopilotActive: (active: boolean) => void;
}

export const AutopilotController: React.FC<AutopilotControllerProps> = ({
  selectedType,
  onChangeType,
  speed,
  onChangeSpeed,
  autopilotActive,
  setAutopilotActive,
}) => {
  const currentTrajectory = TRAJECTORIES.find(t => t.type === selectedType) || TRAJECTORIES[0];

  return (
    <div id="autopilot-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors ${autopilotActive ? 'bg-indigo-600 text-white animate-spin-slow' : 'bg-slate-100 text-slate-500'}`}>
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans">
              1. Orbite Automatique (Autopilote)
            </h2>
            <p className="text-sm font-bold text-slate-800">Trajectoire & Vitesse</p>
          </div>
        </div>

        {/* Quick Activation Toggle Button */}
        <button
          id="autopilot-toggle"
          onClick={() => setAutopilotActive(!autopilotActive)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            autopilotActive
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          {autopilotActive ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Suspendre</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Démarrer</span>
            </>
          )}
        </button>
      </div>

      {/* Trajectory 3D Button Grid */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans">
          Trajectoire 3D
        </span>
        <div id="trajectory-grid" className="grid grid-cols-3 gap-2">
          {TRAJECTORIES.map(t => {
            const isSelected = t.type === selectedType;
            return (
              <button
                key={t.type}
                id={`trajectory-${t.type}`}
                onClick={() => {
                  onChangeType(t.type);
                  // Auto-enable autopilot on trajectory switch for convenient UX
                  setAutopilotActive(true);
                }}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 border text-center cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Description Box */}
      <div id="trajectory-description" className="bg-indigo-50/40 border border-indigo-100/40 rounded-lg p-4 flex flex-col gap-1.5">
        <span className="text-[9px] font-bold tracking-wider text-indigo-600 uppercase font-sans">
          Description
        </span>
        <p className="text-xs font-sans text-slate-600 leading-relaxed font-medium">
          {currentTrajectory.description}
        </p>
      </div>

      {/* Orbit Speed Slider */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans">
            Vitesse d&apos;Orbite
          </span>
          <span id="speed-indicator" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
            {speed.toFixed(1)}x
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400">0.2x</span>
          <input
            id="speed-slider"
            type="range"
            min="0.2"
            max="4.0"
            step="0.1"
            value={speed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <span className="text-[10px] font-bold text-slate-400">4.0x</span>
        </div>
      </div>
    </div>
  );
};
