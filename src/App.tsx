/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Compass, Sparkles, AlertCircle, Volume2, Info, Moon } from 'lucide-react';
import { AcousticScene } from './components/AcousticScene';
import { AutopilotController } from './components/AutopilotController';
import { PlaybackController } from './components/PlaybackController';
import { SoundSelector } from './components/SoundSelector';
import { SOUND_PRESETS } from './data';
import { Position3D, TrajectoryType } from './types';
import { audioEngine } from './audioEngine';

export default function App() {
  // Application states
  const [playing, setPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(60); // 0 to 100
  const [position, setPosition] = useState<Position3D>({ x: 0, y: 0, z: 2.5 });
  const [autopilotActive, setAutopilotActive] = useState<boolean>(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('battement-coeur');
  const [trajectoryType, setTrajectoryType] = useState<TrajectoryType>('gauche-droite');
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1.8);
  const [showHelperInfo, setShowHelperInfo] = useState<boolean>(true);

  // Synchronize play state from the audio engine
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((isPlaying) => {
      setPlaying(isPlaying);
    });

    // Apply defaults to audioEngine on mount
    audioEngine.setVolume(volume / 100);
    audioEngine.setPreset(selectedPresetId);
    audioEngine.setPosition(position);

    return () => {
      unsubscribe();
      audioEngine.stop();
    };
  }, []);

  // Synchronize volume adjustments
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setVolume(newVol / 100);
  };

  // Synchronize sound preset selections
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    audioEngine.setPreset(presetId);
  };

  // Synchronize position adjustments from manual dragging
  const handlePositionChange = (newPos: Position3D) => {
    setPosition(newPos);
    audioEngine.setPosition(newPos);
  };

  // Toggle playback
  const handleTogglePlay = async () => {
    if (playing) {
      audioEngine.stop();
    } else {
      await audioEngine.start();
    }
  };

  // Main orbital trajectory logic
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulatedTime = 0; // accumulated radians for smooth orbital trajectories

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000; // time delta in seconds
      lastTime = now;

      if (playing && autopilotActive) {
        // Base orbital frequency rate (rad/sec)
        const baseFrequency = 1.1; 
        accumulatedTime += dt * orbitSpeed * baseFrequency;

        let newX = 0;
        let newY = 0;
        let newZ = 2.5; // default front focus depth

        switch (trajectoryType) {
          case 'gauche-droite':
            // Oscillates back and forth linearly from -3.5m to +3.5m, slightly in front (+2.5m)
            newX = 3.5 * Math.sin(accumulatedTime);
            newY = 0;
            newZ = 2.5;
            break;

          case 'saut-gd':
            // Periodic instant jumping: alternate between far left and far right
            // Triggered based on the square wave of sine
            newX = Math.sin(accumulatedTime) >= 0 ? 3.5 : -3.5;
            newY = 0;
            newZ = 2.5;
            break;

          case 'haut-bas':
            // Center horizontal, oscillates vertical height from -3.5m to +3.5m
            newX = 0;
            newY = 3.5 * Math.sin(accumulatedTime);
            newZ = 2.5;
            break;

          case 'saut-hb':
            // Periodic instant vertical height jumping
            newX = 0;
            newY = Math.sin(accumulatedTime) >= 0 ? 3.5 : -3.5;
            newZ = 2.5;
            break;

          case 'cercle-360':
            // Complete 360-degree circle around the listener of radius 3.5m
            newX = 3.5 * Math.cos(accumulatedTime);
            newY = 0;
            newZ = 3.5 * Math.sin(accumulatedTime);
            break;

          case 'infini': {
            // Lemniscate of Bernoulli (figure-eight infinity loop)
            const sinT = Math.sin(accumulatedTime);
            const cosT = Math.cos(accumulatedTime);
            const denom = 1 + sinT * sinT;
            const scaleFactor = 3.6;
            newX = (scaleFactor * cosT) / denom;
            newY = 0;
            newZ = (scaleFactor * sinT * cosT) / denom;
            break;
          }

          default:
            break;
        }

        const calculatedPosition = {
          x: Math.round(newX * 100) / 100,
          y: Math.round(newY * 100) / 100,
          z: Math.round(newZ * 100) / 100,
        };

        setPosition(calculatedPosition);
        audioEngine.setPosition(calculatedPosition);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [playing, autopilotActive, orbitSpeed, trajectoryType]);

  const activePreset = SOUND_PRESETS.find((p) => p.id === selectedPresetId) || SOUND_PRESETS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-indigo-100">
      {/* Top Header Row */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shadow-sm z-40 sticky top-0">
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-xs">
            <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
          </div>
          <span className="hover:text-indigo-600 cursor-pointer transition-colors font-medium">Simulateur</span>
          <span>/</span>
          <span className="font-bold text-slate-900">Spatial Audio Compass</span>
          <span className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider ${playing ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
            {playing ? 'Actif' : 'Suspendu'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400">
            <span>WEB AUDIO NODE: READY</span>
            <span>|</span>
            <span>STEREO HRTF</span>
          </div>
          <button
            onClick={handleTogglePlay}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer ${
              playing 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {playing ? 'Suspendre' : 'Démarrer'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Recommendation banner styled after Sleek Interface's dark panels */}
        <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-indigo-500/10 rounded-lg flex-shrink-0 mt-0.5 border border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm md:text-base text-white tracking-wide">
                🎧 Casque ou Écouteurs Stéréo Recommandés !
              </p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                Ce simulateur utilise la technologie de son spatial 3D (HRTF). Le port d&apos;écouteurs stéréo est indispensable pour percevoir l&apos;alternance bilatérale des sons qui favorise l&apos;apaisement du système nerveux (cohérence cardiaque et EMDR).
              </p>
            </div>
          </div>
          <button
            onClick={handleTogglePlay}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider cursor-pointer whitespace-nowrap transition-all uppercase ${
              playing 
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            }`}
          >
            {playing ? 'COUPER LE SON' : 'ESSAYER MAINTENANT'}
          </button>
        </div>

        {/* Collapsible Helper Information Panel */}
        {showHelperInfo && (
          <div id="info-panel" className="bg-white border border-slate-200 rounded-xl p-6 relative shadow-sm">
            <button
              onClick={() => setShowHelperInfo(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 text-[10px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
            >
              Masquer
            </button>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                <Info className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase font-sans mb-1">
                  Principe de la Stimulation Bilatérale Alternée (SBA)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-4xl font-medium">
                  La SBA active alternativement les deux hémisphères cérébraux par le biais de stimulus auditifs gauche/droite. Largement utilisée en thérapie EMDR, cette double attention aide à décharger la tension émotionnelle, à réguler les ruminations anxieuses et à favoriser l&apos;intégration des mémoires. Elle ralentit doucement la fréquence cardiaque et favorise un ancrage corporel immédiat.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bento Grid: Acoustic scene on left, controllers on right */}
        <div id="bento-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 2D Radar Display (Spans 5 columns) */}
          <div className="lg:col-span-5 w-full">
            <AcousticScene
              position={position}
              onChangePosition={handlePositionChange}
              autopilotActive={autopilotActive}
              setAutopilotActive={setAutopilotActive}
            />
          </div>

          {/* Right Column: Autopilot Orbit + Playback Control (Spans 7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            <AutopilotController
              selectedType={trajectoryType}
              onChangeType={setTrajectoryType}
              speed={orbitSpeed}
              onChangeSpeed={setOrbitSpeed}
              autopilotActive={autopilotActive}
              setAutopilotActive={setAutopilotActive}
            />

            <PlaybackController
              playing={playing}
              onTogglePlay={handleTogglePlay}
              volume={volume}
              onChangeVolume={handleVolumeChange}
              activePresetTitle={activePreset.title}
            />
          </div>
        </div>

        {/* Bottom Section: Sound presets choice list */}
        <div className="w-full">
          <SoundSelector
            selectedId={selectedPresetId}
            onChangePreset={handlePresetChange}
          />
        </div>
      </main>

      {/* Footer styled as custom Status Bar */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 flex items-center px-6 justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-12">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            MOTEUR AUDIO OPÉRATIONNEL
          </span>
          <span className="opacity-30">|</span>
          <span className="hidden sm:inline">COHÉRENCE CARDIAQUE & EMDR</span>
        </div>
        <div className="flex items-center gap-4">
          <span>WEB AUDIO HRTF</span>
          <span className="opacity-30">|</span>
          <span>SPATIAL COMPASS v2.5</span>
        </div>
      </footer>
    </div>
  );
}
