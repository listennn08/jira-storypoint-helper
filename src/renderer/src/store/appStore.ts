import { JiraConfig } from '@renderer/types'
import { create } from 'zustand'

interface AlertItem {
  message: string
  severity: 'error' | 'warning' | 'info' | 'success'
}

interface AppState {
  loadedConfig: boolean
  activeTab: string
  jiraConfig: JiraConfig
  alerts: Array<AlertItem>
  setJiraConfig: (config: JiraConfig) => void
  setJiraConfigByKey: (key: keyof JiraConfig, value: JiraConfig[keyof JiraConfig]) => void
  setActiveTab: (path: string) => void
  loadConfig: (loaded: boolean) => void
  addAlerts: (alert: AlertItem) => void
  removeAlerts: (index: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  loadedConfig: false,
  activeTab: localStorage.getItem('active-tab') ? localStorage.getItem('active-tab')! : '/',
  alerts: [],
  jiraConfig: {
    email: '',
    apiKey: '',
    baseURL: '',
    sprintStartWord: '',
    boards: []
  },
  setJiraConfig: (config): void => set((state) => ({ ...state, jiraConfig: config })),
  setJiraConfigByKey: (key, value): void =>
    set((state) => ({
      ...state,
      jiraConfig: {
        ...state.jiraConfig,
        [key]: value
      }
    })),
  setActiveTab: (path): void => set((state) => ({ ...state, activeTab: path })),
  loadConfig: (loaded): void => set((state) => ({ ...state, loadedConfig: loaded })),
  addAlerts: (alert: AlertItem): void =>
    set((state) => ({ ...state, alerts: [...state.alerts, alert] })),
  removeAlerts: (index: number): void =>
    set((state) => {
      state.alerts.splice(index, 1)
      return {
        ...state,
        alerts: state.alerts
      }
    })
}))
