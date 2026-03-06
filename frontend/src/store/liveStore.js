/**
 * Zustand store untuk live detection state
 */
import { create } from 'zustand'

const useLiveStore = create((set) => ({
  isLive: false,
  websocket: null,
  currentFrame: null,
  latestDetection: null,
  
  setLive: (isLive) => set({ isLive }),
  
  setWebsocket: (websocket) => set({ websocket }),
  
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  
  setLatestDetection: (detection) => set({ latestDetection: detection }),
  
  disconnect: () => {
    const { websocket } = useLiveStore.getState()
    if (websocket) {
      websocket.close()
    }
    set({ isLive: false, websocket: null, currentFrame: null })
  },
}))

export default useLiveStore
