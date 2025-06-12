// src/stores/courseFilterStore.js
import { create } from 'zustand';

export const useCourseFilterStore = create((set) => ({
  searchTerm: '',
  filterClass: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilterClass: (classLevel) => set({ filterClass: classLevel }),
  clearFilters: () => set({ searchTerm: '', filterClass: '' }),
}));