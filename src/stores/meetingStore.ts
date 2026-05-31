import { create } from 'zustand'
import type { Meeting, OutputLanguage } from '@/types'

interface MeetingState {
  meeting: Meeting | null
  outputLanguage: OutputLanguage
  translating: boolean
  setMeeting: (m: Meeting) => void
  setOutputLanguage: (lang: OutputLanguage) => void
  setTranslating: (v: boolean) => void
  clearMeeting: () => void
  updateActionItemComplete: (id: string, done: boolean) => void
}

export const useMeetingStore = create<MeetingState>()((set) => ({
  meeting: null,
  outputLanguage: 'en',
  translating: false,
  setMeeting: (meeting) => set({ meeting }),
  setOutputLanguage: (outputLanguage) => set({ outputLanguage }),
  setTranslating: (translating) => set({ translating }),
  clearMeeting: () => set({ meeting: null }),
  updateActionItemComplete: (id, done) =>
    set((state) => ({
      meeting: state.meeting
        ? {
            ...state.meeting,
            actionItems: state.meeting.actionItems.map((a) =>
              a.id === id ? { ...a, isCompleted: done } : a
            ),
          }
        : null,
    })),
}))
