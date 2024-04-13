import { JiraConfig } from '@renderer/types'
import { createContext, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'

interface AppContextProps {
  loadedConfig: boolean
  activeTab: number
  jiraConfig: JiraConfig
  setJiraConfig: React.Dispatch<React.SetStateAction<AppContextProps['jiraConfig']>>
  setActiveTab: React.Dispatch<React.SetStateAction<number>>
  loadConfig: () => void
}

const AppContext = createContext<AppContextProps>({
  loadedConfig: false,
  activeTab: 0,
  jiraConfig: {
    email: '',
    apiKey: '',
    baseURL: '',
    sprintStartWord: '',
    boards: []
  },
  setJiraConfig: () => {},
  setActiveTab: () => {},
  loadConfig: () => {}
})

export const AppContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [loadedConfig, setLoadedConfig] = useState(false)
  const [jiraConfig, setJiraConfig] = useState<AppContextProps['jiraConfig']>({
    email: '',
    apiKey: '',
    baseURL: '',
    sprintStartWord: '',
    boards: []
  })
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem('active-tab') ? Number(localStorage.getItem('active-tab')) : 0
  )
  const [cspMetaTag, setCspMetaTAg] = useState({
    httpEquive: 'Content-Security-Policy',
    content: {
      'default-src': [`'self'`],
      'script-src': [`'self'`],
      'style-src': [`'self'`, `'unsafe-inline'`],
      'img-src': [`'self'`]
    }
  })
  const [isSetCSP, setIsSetCSP] = useState(false)

  function loadConfig(): void {
    const jiraConfig = localStorage.getItem('jira-config')
    if (jiraConfig) {
      setJiraConfig(() => {
        const config = JSON.parse(jiraConfig) as JiraConfig

        setCspMetaTAg((prev) => ({
          ...prev,
          content: {
            ...prev.content,
            'img-src': [...prev.content['img-src'], `${config.baseURL}/`]
          }
        }))

        return config
      })
    }

    setLoadedConfig(true)
    setIsSetCSP(true)
  }

  useEffect(() => {
    localStorage.setItem('active-tab', activeTab.toString())
  }, [activeTab])

  useEffect(() => {
    loadConfig()
  }, [])

  function redirectToSettingIfConfigNotSet(): void {
    if (!loadedConfig) return
    if (!jiraConfig.email || !jiraConfig.apiKey || !jiraConfig.baseURL) {
      setActiveTab(2)
      return
    }
  }

  useEffect(() => {
    redirectToSettingIfConfigNotSet()
  }, [loadedConfig])

  return (
    <AppContext.Provider
      value={{
        loadedConfig,
        jiraConfig,
        setJiraConfig,
        activeTab,
        setActiveTab,
        loadConfig
      }}
    >
      <Helmet>
        <title>Jira Board</title>
        <meta
          httpEquiv={cspMetaTag.httpEquive}
          content={Object.entries(cspMetaTag.content)
            .map(([key, value]) => `${key} ${value.join(' ')}`)
            .join(';')}
        />
      </Helmet>
      {isSetCSP && children}
    </AppContext.Provider>
  )
}

export default AppContext
