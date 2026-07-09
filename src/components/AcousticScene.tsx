/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Headphones, Volume2, Move } from 'lucide-react';
import { Position3D } from '../types';

interface AcousticSceneProps {
  position: Position3D;
  onChangePosition: (pos: Position3D) => void;
  autopilotActive: boolean;
  setAutopilotActive: (active: boolean) => void;
}

export const AcousticScene: React.FC<AcousticSceneProps> = ({
  position,
  onChangePosition,
  autopilotActive,
  setAutopilotActive,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert mouse/touch event coordinates inside SVG to [-5, +5] acoustic coordinates
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // If the user clicks the source or anywhere on the scene, we let them position it manually
    setIsDragging(true);
    setAutopilotActive(false); // Manually dragging overrides autopilot
    updatePositionFromEvent(e);
    if (svgRef.current) {
      svgRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    updatePositionFromEvent(e);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      setIsDragging(false);
      if (svgRef.current) {
        svgRef.current.releasePointerCapture(e.pointerId);
      }
    }
  };

  const updatePositionFromEvent = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = e.clientX;
    const clientY = e.clientY;

    // Relative offset from center in pixels
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Convert pixels to meters (max radius is 5 meters, corresponding to half width of the box)
    const maxRadiusMeters = 5.0;
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;

    // Calculate raw meters
    let x = (dx / halfWidth) * maxRadiusMeters;
    let z = -(dy / halfHeight) * maxRadiusMeters; // top of screen is positive front (+Z)

    // Constrain to a circle or square of 5m
    // To make dragging feel great, let's keep it within 5 meters boundary
    const distance = Math.sqrt(x * x + z * z);
    if (distance > maxRadiusMeters) {
      const angle = Math.atan2(z, x);
      x = maxRadiusMeters * Math.cos(angle);
      z = maxRadiusMeters * Math.sin(angle);
    }

    // Keep height (y) at its current value unless we are explicitly dragging height
    // We round to 2 decimal places for stability
    onChangePosition({
      x: Math.round(x * 100) / 100,
      y: position.y, // Maintain height
      z: Math.round(z * 100) / 100,
    });
  };

  // SVG coordinate calculations for drawing
  // Map acoustic [-5, +5] to SVG percentages or viewbox coords [-100, 100]
  const mapCoordToPercent = (val: number) => {
    // val is [-5, 5] -> return percentage string
    return `${((val + 5) / 10) * 100}%`;
  };

  const sourceX = mapCoordToPercent(position.x);
  // Z coordinate is positive front. In screen space, front is top (negative SVG Y)
  const sourceY = mapCoordToPercent(-position.z);

  // We can also calculate a visual radius for 3D depth.
  // If height (y) is high or low, we can visualize it with a height shadow.
  const distanceToListener = Math.sqrt(position.x * position.x + position.z * position.z).toFixed(1);

  return (
    <div id="acoustic-scene-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h2 className="text-xs font-bold tracking-wider text-slate-800 uppercase font-sans">
            Scène Acoustique 2D
          </h2>
        </div>
        <div className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          X: {position.x.toFixed(2)}m | Y (Haut): {position.y.toFixed(2)}m | Z (Avant): {position.z.toFixed(2)}m
        </div>
      </div>

      {/* Main Radar Container */}
      <div className="relative w-full aspect-square max-w-[380px] bg-slate-50/80 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center select-none">
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          viewBox="-100 -100 200 200"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Grid Background Lines (crosshair axes) */}
          <line x1="-100" y1="0" x2="100" y2="0" stroke="#f1f5f9" strokeWidth="2" />
          <line x1="0" y1="-100" x2="0" y2="100" stroke="#f1f5f9" strokeWidth="2" />
          
          <line x1="-100" y1="0" x2="100" y2="0" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="-100" x2="0" y2="100" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

          {/* Concentric Distance Rings (1m, 2m, 3m, 4m, 5m) */}
          {[20, 40, 60, 80, 100].map((r, i) => (
            <circle
              key={r}
              cx="0"
              cy="0"
              r={r}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="0.75"
              strokeDasharray={i === 4 ? 'none' : '3 3'}
            />
          ))}

          {/* Text Labels along the axes */}
          <text x="5" y="-84" className="text-[7px] font-bold fill-slate-400 select-none font-mono">4m</text>
          <text x="5" y="-64" className="text-[7px] font-bold fill-slate-400 select-none font-mono">3m</text>
          <text x="5" y="-44" className="text-[7px] font-bold fill-slate-400 select-none font-mono">2m</text>
          <text x="5" y="-24" className="text-[7px] font-bold fill-slate-400 select-none font-mono">1m</text>

          {/* Axis Labels */}
          <text x="0" y="-88" textAnchor="middle" className="text-[8px] font-bold tracking-widest fill-slate-400 font-sans select-none">
            AVANT (+)
          </text>
          <text x="0" y="94" textAnchor="middle" className="text-[8px] font-bold tracking-widest fill-slate-400 font-sans select-none">
            ARRIÈRE (-)
          </text>
          <text x="-95" y="3" textAnchor="start" className="text-[8px] font-bold tracking-widest fill-slate-400 font-sans select-none">
            GAUCHE (-)
          </text>
          <text x="95" y="3" textAnchor="end" className="text-[8px] font-bold tracking-widest fill-slate-400 font-sans select-none">
            DROITE (+)
          </text>
        </svg>

        {/* 1. Listener Node in Center (0,0) */}
        <div
          id="listener-node"
          className="absolute w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 shadow-sm flex items-center justify-center pointer-events-none z-10"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse">
            <Headphones className="w-4.5 h-4.5 text-indigo-600" />
          </div>
        </div>

        {/* 2. Sound Source Node (Draggable) */}
        <div
          id="sound-source-node"
          className={`absolute w-10 h-10 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-all z-20 ${
            isDragging
              ? 'bg-emerald-500 shadow-lg text-white scale-110 ring-4 ring-emerald-100'
              : 'bg-indigo-600 shadow-md text-white hover:bg-indigo-700 hover:scale-105'
          }`}
          style={{
            left: sourceX,
            top: sourceY,
            transform: 'translate(-50%, -50%)',
            transition: isDragging ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out, transform 0.2s',
          }}
        >
          {/* Small height offset visualization indicator */}
          {Math.abs(position.y) > 0.1 && (
            <div
              className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${
                position.y > 0
                  ? 'bg-amber-500 text-white border-amber-400'
                  : 'bg-violet-500 text-white border-violet-400'
              }`}
            >
              H: {position.y > 0 ? '+' : ''}{position.y.toFixed(1)}m
            </div>
          )}
          
          <Volume2 className={`w-5 h-5 ${isDragging ? 'animate-bounce' : 'animate-pulse'}`} />
          
          {/* Subtle drag cue indicator on hover */}
          <div className="absolute -bottom-1 -right-1 bg-white border border-slate-200 text-slate-500 p-0.5 rounded-full shadow-xs scale-75">
            <Move className="w-3 h-3" />
          </div>
        </div>

        {/* Dynamic Sweep / Orbit Line overlay to help visualize autopilot */}
        {autopilotActive && (
          <div className="absolute bottom-3 left-3 bg-indigo-50/90 backdrop-blur-xs border border-indigo-100 px-2.5 py-1 rounded-md text-[10px] font-sans font-bold text-indigo-600 select-none animate-pulse">
            Autopilote Actif
          </div>
        )}
      </div>

      <div className="mt-5 w-full flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-sans text-slate-500">
          Glissez le haut-parleur bleu pour positionner manuellement le signal sonore.
        </p>
        <p className="text-[11px] font-sans text-slate-400 mt-1">
          Rayon max : 5 mètres | Distance actuelle : <span className="font-bold text-indigo-600">{distanceToListener}m</span>
        </p>
      </div>
    </div>
  );
};
