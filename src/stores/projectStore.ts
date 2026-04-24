import { create } from 'zustand';
import { Project } from '@/types/database';

interface ProjectState {
  project: Project | null;
  setProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  setProject: (project) => set({ project }),
}));
