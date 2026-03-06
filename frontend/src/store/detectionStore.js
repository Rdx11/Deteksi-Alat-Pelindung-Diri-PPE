/**
 * Zustand store untuk detection state
 */
import { create } from 'zustand'

const useDetectionStore = create((set) => ({
  currentSession: null,
  detectionResults: [],
  isProcessing: false,
  
  setCurrentSession: (session) => set({ currentSession: session }),
  
  addDetectionResult: (result) => 
    set((state) => ({ 
      detectionResults: [...state.detectionResults, result] 
    })),
  
  clearResults: () => 
    set({ detectionResults: [], currentSession: null }),
  
  setProcessing: (isProcessing) => 
    set({ isProcessing }),
}))

export default useDetectionStore
