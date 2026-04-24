/**
 * projectStore.ts
 * Global Zustand store for the current project.
 *
 * Each user has exactly one construction project. This store holds
 * the loaded project object so all hooks/screens can access it without
 * prop-drilling or re-fetching.
 *
 * Usage:
 *   const { project } = useProjectStore();
 *   const { setProject } = useProjectStore();
 */
import { create } from 'zustand';
import { Project } from '@/types/database';

interface ProjectState {
  project: Project | null;               // null = not yet loaded or no project
  setProject: (project: Project | null) => void; // called by useProject hook
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  setProject: (project) => set({ project }),
}));
