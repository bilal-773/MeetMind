import { create } from 'zustand'

type MeetingPanel = 'transcript' | 'minutes' | 'actions' | 'export'

interface UiState {
  activeMeetingPanel: MeetingPanel
  exportLoading: Record<string, boolean>
  speakerNames: Record<string, string>
  sidebarOpen: boolean
  setActiveMeetingPanel: (p: MeetingPanel) => void
  setExportLoading: (format: string, loading: boolean) => void
  renameSpeaker: (key: string, name: string) => void
  setSidebarOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  activeMeetingPanel: 'transcript',
  exportLoading: {},
  speakerNames: {},
  sidebarOpen: true,
  setActiveMeetingPanel: (activeMeetingPanel) => set({ activeMeetingPanel }),
  setExportLoading: (format, loading) =>
    set((s) => ({ exportLoading: { ...s.exportLoading, [format]: loading } })),
  renameSpeaker: (key, name) =>
    set((s) => ({ speakerNames: { ...s.speakerNames, [key]: name } })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
