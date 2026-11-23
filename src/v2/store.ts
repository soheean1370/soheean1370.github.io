import { create } from 'zustand';

/** per-frame values live here (mutable, no re-render) */
export const live = { p: 0, velocity: 0, mode: 'fixed', points: 0, fov: 42 };

type Panel = null | { kind: 'hello' | 'research' | 'stack' | 'contact' | 'project'; id?: string };
type State = {
  panel: Panel; focus: string | null; vMode: boolean; dev: boolean; quality: 'high' | 'low'; ready: boolean;
  open: (p: Panel, focus?: string | null) => void; close: () => void;
  toggleV: () => void; toggleDev: () => void; setQuality: (q: 'high' | 'low') => void; setReady: () => void;
};
export const useStore = create<State>((set) => ({
  panel: null, focus: null, vMode: false, dev: false, quality: 'high', ready: false,
  open: (panel, focus = null) => set({ panel, focus }),
  close: () => set({ panel: null, focus: null }),
  toggleV: () => set((s) => ({ vMode: !s.vMode })),
  toggleDev: () => set((s) => ({ dev: !s.dev })),
  setQuality: (quality) => set({ quality }),
  setReady: () => set({ ready: true }),
}));
