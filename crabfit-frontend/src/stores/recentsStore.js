import create from 'zustand'
import { persist } from 'zustand/middleware'

const useRecentsStore = create(persist(
  set => ({
    recents: [],

    addRecent: event => set(state => {
      const recents = state.recents.filter(e => e.id !== event.id)
      recents.unshift(event)
      recents.length = Math.min(recents.length, 5)
      return { recents }
    }),
    removeRecent: id => set(state => {
      const recents = state.recents.filter(e => e.id !== id)
      return { recents }
    }),
    clearRecents: () => set({ recents: [] }),
  }),
  { name: 'crabfit-recent' },
))

export default useRecentsStore
