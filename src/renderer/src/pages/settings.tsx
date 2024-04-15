import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import {
  Clear,
  Download,
  DragIndicator,
  Save,
  Upload,
  Visibility,
  VisibilityOff
} from '@mui/icons-material'
import { DragDropContext, Draggable, DropResult, Droppable } from 'react-beautiful-dnd'
import { Buffer } from 'buffer'
import DownloadDialog from '@renderer/components/settings/DownloadDialog'
import BoardItem from '@renderer/components/settings/BoardItem'
import { reorder } from '@renderer/utils'

import { Board, JiraConfig } from '@renderer/types'
import { useAppStore } from '@renderer/store/appStore'

export const Setting = (): JSX.Element => {
  const jiraConfig = useAppStore((state) => state.jiraConfig)
  const setJiraConfig = useAppStore((state) => state.setJiraConfig)
  const setJiraConfigByKey = useAppStore((state) => state.setJiraConfigByKey)
  const addAlerts = useAppStore((state) => state.addAlerts)
  const [state, setState] = useState({
    activeTab: 0
  })
  const initialNewForm = (): JiraConfig => ({
    email: '',
    apiKey: '',
    baseURL: '',
    sprintStartWord: '',
    boards: []
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function handleClickShowPassword(): void {
    setShowPassword(!showPassword)
  }

  function handleMouseDownPassword(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault()
  }

  function handleExport(confirm: boolean): void {
    const data: Record<string, string | Board[] | undefined> = {
      email: confirm ? jiraConfig.email : undefined,
      apiKey: confirm ? jiraConfig.apiKey : undefined,
      baseURL: jiraConfig.baseURL,
      sprintStartWord: jiraConfig.sprintStartWord,
      boards: jiraConfig.boards
    }

    for (const key in data) {
      if (!data[key]) {
        delete data[key]
      }
    }

    const file = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = 'jira-config.json'
    a.click()
    addAlerts({
      severity: 'success',
      message: 'Options exported'
    })
  }

  function readConfigFile(file: File): void {
    const reader = new FileReader()
    reader.onload = function (e): void {
      const data = JSON.parse(e.target?.result as string)
      setJiraConfig(data)
      addAlerts({
        severity: 'success',
        message: 'Options imported'
      })

      localStorage.setItem('jira-config', JSON.stringify(data))
      addAlerts({ severity: 'success', message: 'Options saved' })

      // reload to refresh CSP meta tag
      setTimeout(() => window.location.reload(), 500)
    }

    reader.readAsText(file)
  }

  function handleImport(): void {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e): void => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        readConfigFile(file)
      }
    }
    input.click()
  }

  function handleSaveOption(): void {
    localStorage.setItem('jira-config', JSON.stringify(jiraConfig))
    addAlerts({ severity: 'success', message: 'Options saved' })
    // reload to refresh CSP meta tag
    setTimeout(() => window.location.reload(), 500)
  }

  function handleClearOption(): void {
    localStorage.removeItem('jira-config')
    addAlerts({ severity: 'success', message: 'Options cleared' })
    setJiraConfig(initialNewForm())
  }

  async function getAllJiraBoard(): Promise<void> {
    const resp = (await window.electron.ipcRenderer.invoke(
      'request',
      `${jiraConfig.baseURL}/rest/agile/1.0/board`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${jiraConfig.email}:${jiraConfig.apiKey}`).toString(
            'base64'
          )}`
        }
      }
    )) as {
      values: {
        id: number
        type: string
        location: {
          displayName: string
          projectKey: string
        }
      }[]
    }
    setJiraConfigByKey(
      'boards',
      resp.values
        .filter((el) => el.type === 'scrum')
        .map((board) => ({
          id: board.id.toString(),
          name: board.location.displayName,
          key: board.location.projectKey,
          enabled: true
        }))
    )
  }

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return

      const newBoards = reorder(jiraConfig.boards, result.source.index, result.destination.index)
      setJiraConfigByKey('boards', newBoards as Board[])
    },
    [jiraConfig.boards]
  )

  useEffect(() => {
    const config = localStorage.getItem('jira-config')
    if (config) {
      setJiraConfig(JSON.parse(config))
    }
  }, [])

  return (
    <Box p={2}>
      <Typography variant="h4" width="100%">
        Configuration
      </Typography>
      <Grid container justifyContent="end" gap={2}>
        <IconButton color="primary" onClick={handleSaveOption} title="Save settings">
          <Save />
        </IconButton>
        <IconButton
          color="success"
          onClick={() => setIsDialogOpen(true)}
          title="Download settings as json file"
        >
          <Download />
        </IconButton>
        <IconButton color="secondary" onClick={handleImport} title="Upload settings from disk">
          <Upload />
        </IconButton>
        <IconButton color="error" onClick={handleClearOption} title="Remove all settings">
          <Clear />
        </IconButton>
      </Grid>

      <Tabs
        value={state.activeTab}
        onChange={(_e, activeTab) =>
          setState((state) => ({
            ...state,
            activeTab
          }))
        }
      >
        <Tab label="Basic" />
        <Tab label="Advanced" />
      </Tabs>
      <Box py={4}>
        {/* Jira base URL, Jira account email, Jira API key */}
        <div
          role="tabpanel-0"
          key={`tabpanel-0`}
          hidden={state.activeTab !== 0}
          id={`tabpanel-0`}
          aria-labelledby={`tab-0`}
        >
          <Grid container gap={4} justifyContent="end">
            <TextField
              label="Jira base URL"
              value={jiraConfig.baseURL}
              required
              onChange={(e) => setJiraConfigByKey('baseURL', e.target.value)}
              fullWidth
            />
            <TextField
              label="Jira account email"
              value={jiraConfig.email}
              required
              onChange={(e) => setJiraConfigByKey('email', e.target.value)}
              fullWidth
            />
            <TextField
              label="Jira API key"
              type={showPassword ? 'text' : 'password'}
              value={jiraConfig.apiKey}
              onChange={(e) => setJiraConfigByKey('apiKey', e.target.value)}
              fullWidth
              required
              helperText={
                <Link
                  href="https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How to generate API token
                </Link>
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </div>

        {/* Sprint start word, Jira boards */}
        <div
          role="tabpanel-1"
          key={`tabpanel-1`}
          hidden={state.activeTab !== 1}
          id={`tabpanel-1`}
          aria-labelledby={`tab-1`}
        >
          <Grid container gap={4} justifyContent="end">
            <TextField
              label="Sprint start word"
              value={jiraConfig.sprintStartWord}
              onChange={(e) => setJiraConfigByKey('sprintStartWord', e.target.value)}
              fullWidth
            />

            <Grid container item xs={12} gap={2} alignItems="center">
              <Grid container item xs={12} gap={2} mb={2} alignItems="center">
                <Typography variant="h5">Jira Boards</Typography>
                <Button color="primary" variant="contained" size="small" onClick={getAllJiraBoard}>
                  Load Jira Board
                </Button>
              </Grid>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="droppable">
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ opacity: snapshot.isDraggingOver ? 0.5 : 1 }}
                    >
                      {jiraConfig.boards.map((board, index) => (
                        <Draggable
                          key={`draggable-${board.id}`}
                          draggableId={`draggable-${board.id}`}
                          index={index}
                        >
                          {(p) => (
                            <Grid
                              ref={p.innerRef}
                              container
                              item
                              xs={12}
                              alignItems="center"
                              {...p.draggableProps}
                              style={p.draggableProps.style}
                            >
                              <Grid item xs={1}>
                                <IconButton sx={{ cursor: 'grab' }} {...p.dragHandleProps}>
                                  <DragIndicator />
                                </IconButton>
                              </Grid>
                              <Grid item xs={11}>
                                <BoardItem board={board} index={index} />
                              </Grid>
                            </Grid>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </DragDropContext>
            </Grid>
          </Grid>
        </div>
      </Box>

      <DownloadDialog
        open={isDialogOpen}
        handleClose={() => setIsDialogOpen(false)}
        handleConfirm={handleExport}
      />
    </Box>
  )
}

export default Setting
