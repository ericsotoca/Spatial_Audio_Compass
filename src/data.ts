/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundPreset, TrajectoryInfo } from './types';

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'averse-apaisante',
    title: 'Averse Apaisante',
    subtitle: 'Soothing Rain Wash',
    description: 'Stimulation Bilatérale Alternée naturelle et relaxante. Idéal pour apaiser l\'anxiété pendant la reconsolidation de la mémoire.'
  },
  {
    id: 'foret-carillons',
    title: 'Forêt & Carillons',
    subtitle: 'Mindful Chimes & Birds',
    description: 'Ambiance de nature sauvage mêlant carillons cristallins et gazouillis légers pour un ancrage cognitif positif et serein.'
  },
  {
    id: 'bol-tibethain-vibratoire',
    title: 'Bol Tibétain Vibratoire',
    subtitle: 'Vibrating Tibetan Bowl',
    description: 'Harmoniques riches et detunées créant un bourdonnement enveloppant pour une résonance cérébrale harmonisante.'
  },
  {
    id: 'battement-coeur',
    title: 'Battement de Cœur',
    subtitle: 'Grounding Heartbeat',
    description: 'Le rythme rassurant d\'un cœur à 60 BPM. Idéal pour réduire les états d\'alerte et d\'hyperactivation nerveuse.'
  },
  {
    id: 'frequence-sacree',
    title: 'Fréquence Sacrée 528 Hz',
    subtitle: 'Solfeggio Healing 528Hz',
    description: 'Une fréquence pure résonant avec des harmoniques de soutien physique et mental, propice à la relaxation profonde.'
  },
  {
    id: 'handpan-meditatif',
    title: 'Handpan Méditatif',
    subtitle: 'Meditative Handpan',
    description: 'Notes de métal sculpté douces et envoûtantes. Offre des harmoniques parfaites pour une double attention fluide et agréable.'
  },
  {
    id: 'hang-drum-profond',
    title: 'Hang Drum Profond',
    subtitle: 'Deep Hang Drum',
    description: 'Sons de cupole chauds et profonds avec une résonance de basse apaisante, ralentissant naturellement le rythme cardiaque.'
  },
  {
    id: 'tongue-drum-celeste',
    title: 'Tongue Drum Céleste',
    subtitle: 'Celestial Tongue Drum',
    description: 'Pulsations cristallines et pures de cloches de bois et d\'acier. Extrêmement faciles à suivre mentalement de gauche à droite.'
  },
  {
    id: 'bol-tibethain-martele',
    title: 'Bol Tibétain Martelé',
    subtitle: 'Struck Tibetan Singing Bowl',
    description: 'Frappe lente au maillet de feutre suivie d\'une vibration ondulatoire riche et sacrée. Idéal pour la désensibilisation lente.'
  },
  {
    id: 'kalimba-feerique',
    title: 'Kalimba Féerique',
    subtitle: 'Dreamy Kalimba',
    description: 'Tines métalliques douces pincées sur caisse boisée. Procure un sentiment d\'ancrage d\'enfance sécurisant.'
  }
];

export const TRAJECTORIES: TrajectoryInfo[] = [
  {
    type: 'gauche-droite',
    label: 'Gauche-Droite',
    description: 'Mouvement linéaire oscillant de gauche à droite devant vous.'
  },
  {
    type: 'saut-gd',
    label: 'Saut G-D',
    description: 'Sauts instantanés alternant entre l\'extrême gauche et l\'extrême droite, optimisé pour la stimulation bilatérale EMDR.'
  },
  {
    type: 'haut-bas',
    label: 'Haut-Bas',
    description: 'Mouvement d\'oscillation verticale fluide de haut en bas devant vous.'
  },
  {
    type: 'saut-hb',
    label: 'Saut H-B',
    description: 'Sauts verticaux instantanés alternant entre le point le plus haut et le point le plus bas.'
  },
  {
    type: 'cercle-360',
    label: 'Cercle 360°',
    description: 'Mouvement circulaire continu décrivant une orbite fluide et régulière autour du point d\'écoute.'
  },
  {
    type: 'infini',
    label: 'Infini (∞)',
    description: 'Orbite continue dessinant une courbe en huit (Lemniscate de Bernoulli), favorisant une profonde focalisation.'
  }
];
