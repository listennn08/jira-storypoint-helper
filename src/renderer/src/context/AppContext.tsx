import { useAppStore } from '@renderer/store/appStore'
import { JiraConfig } from '@renderer/types'
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'

export const AppContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const jiraConfig = useAppStore((state) => state.jiraConfig)
  const loadedConfig = useAppStore((state) => state.loadedConfig)
  const activeTab = useAppStore((state) => state.activeTab)
  const alerts = useAppStore((state) => state.alerts)
  const setJiraConfigByKey = useAppStore((state) => state.setJiraConfigByKey)
  const setActiveTab = useAppStore((state) => state.setActiveTab)
  const removeAlerts = useAppStore((state) => state.removeAlerts)
  const setLoadedConfig = useAppStore((state) => state.loadConfig)
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
      const config = JSON.parse(jiraConfig) as JiraConfig
      for (const key in config) {
        setJiraConfigByKey(key as keyof JiraConfig, config[key])
      }

      setCspMetaTAg((prev) => ({
        ...prev,
        content: {
          ...prev.content,
          'img-src': [...prev.content['img-src'], `${config.baseURL}/`]
        }
      }))
    }

    setLoadedConfig(true)
    setIsSetCSP(true)
  }

  useEffect(() => {
    localStorage.setItem('active-tab', activeTab.toString())
  }, [activeTab])

  function redirectToSettingIfConfigNotSet(): void {
    if (!loadedConfig) return
    if (!jiraConfig.email || !jiraConfig.apiKey || !jiraConfig.baseURL) {
      setActiveTab('/settings')
      return
    }
  }

  useEffect(() => {
    if (!loadedConfig) {
      loadConfig()
    }
    redirectToSettingIfConfigNotSet()
  }, [loadedConfig])

  useEffect(() => {
    setTimeout(() => {
      removeAlerts(0)
    }, 2500)
  }, [alerts])

  return (
    <>
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
    </>
  )
}
