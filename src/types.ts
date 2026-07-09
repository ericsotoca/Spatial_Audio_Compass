/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TrajectoryType = 'gauche-droite' | 'saut-gd' | 'haut-bas' | 'saut-hb' | 'cercle-360' | 'infini';

export interface TrajectoryInfo {
  type: TrajectoryType;
  label: string;
  description: string;
}

export interface SoundPreset {
  id: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface Position3D {
  x: number; // Left-Right (-5m to +5m)
  y: number; // Up-Down (Height, -5m to +5m)
  z: number; // Front-Back (-5m to +5m)
}
