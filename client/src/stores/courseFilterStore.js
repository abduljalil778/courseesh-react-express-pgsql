// src/stores/courseFilterStore.js
import { create } from 'zustand';

export const useCourseFilterStore = create((set) => ({
  searchTerm: '',
  filterClass: '',
  category: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilterClass: (classLevel) => set({ filterClass: classLevel }),
  setCategory: (cat) => set({ category: cat }),
  clearFilters: () => set({ searchTerm: '', filterClass: '' }),
}));