/**
 * Zustand store untuk authentication
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      
      setAuth: (user, accessToken, refreshToken) => 
        set({ user, accessToken, refreshToken }),
      
      setAccessToken: (accessToken) => 
        set({ accessToken }),
      
      logout: () => 
        set({ user: null, accessToken: null, refreshToken: null }),
      
      isAuthenticated: () => {
        const state = useAuthStore.getState()
        return !!state.accessToken
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

export default useAuthStore
