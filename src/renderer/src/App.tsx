import { type ReactElement, useContext } from 'react'
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  CircularProgress,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  SelectChangeEvent
} from '@mui/material'
import { Feed, Person, Refresh, Settings } from '@mui/icons-material'

import AppContext from './context/AppContext'
import TicketTabs from './components/TicketTabs'
import StoryPointTable from './components/StoryPointTable'
import Setting from './components/setting'
import useFetchData from './hook'

import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { Filter } from './types'

export const App = (): JSX.Element => {
  const {
    boardMap,
    loading,
    error,
    userOptions,
    sprintOptions,
    filteredTickets,
    filter,
    loadingText,
    setFilter,
    fetchData
  } = useFetchData()
  const { activeTab, setActiveTab } = useContext(AppContext)

  let content: ReactElement | undefined = undefined

  if (loading && activeTab !== 2) {
    content = (
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CircularProgress />
        <div dangerouslySetInnerHTML={{ __html: loadingText }} />
      </Box>
    )
  }

  if (error) {
    content = (
      <Typography variant="h6" textAlign="center" component="div" width="100%" p={2} color="error">
        {error}
      </Typography>
    )
  }

  function handleChangeFilter(
    key: 'board' | 'user' | 'sprint',
    event: SelectChangeEvent<string[]>
  ): void {
    const value = event.target.value
    setFilter((filter: Filter) => ({
      ...filter,
      [key]: value
    }))
  }

  return (
    <main>
      <Box sx={{ mb: 6, p: 2, minHeight: 'calc(100vh - 56px)' }}>
        {activeTab !== 2 && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <FormControl sx={{ width: '200px' }}>
              <InputLabel id="board-select">Filter Board</InputLabel>
              <Select
                id="board-select"
                label="Filter Board"
                multiple
                value={filter.board}
                onChange={(event) => handleChangeFilter('board', event)}
              >
                {boardMap &&
                  Object.keys(boardMap).map((key) => (
                    <MenuItem value={boardMap[key].key} key={key}>
                      {boardMap[key].name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl sx={{ width: '200px' }}>
              <InputLabel id="user-select">Filter User</InputLabel>
              <Select
                id="user-select"
                label="Filter User"
                multiple
                value={filter.user}
                onChange={(event) => handleChangeFilter('user', event)}
              >
                {userOptions &&
                  userOptions.map((user) => (
                    <MenuItem value={user} key={user}>
                      {user}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl sx={{ width: '200px' }}>
              <InputLabel id="sprint-select">Filter Sprint</InputLabel>
              <Select
                id="sprint-select"
                label="Filter Sprint"
                multiple
                value={filter.sprint}
                onChange={(event) => handleChangeFilter('sprint', event)}
              >
                {sprintOptions &&
                  sprintOptions.map((sprint) => (
                    <MenuItem value={sprint} key={sprint}>
                      {sprint}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <IconButton sx={{ ml: 'auto' }} color="primary" onClick={fetchData}>
              <Refresh />
            </IconButton>
          </Box>
        )}

        {content || (
          <>
            {activeTab === 0 && <StoryPointTable tickets={filteredTickets} />}
            {activeTab === 1 && <TicketTabs tickets={filteredTickets} />}
            {activeTab === 2 && <Setting />}
          </>
        )}
      </Box>
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999 }}>
        <BottomNavigation
          showLabels
          value={activeTab}
          onChange={(_event, newValue) => {
            setActiveTab(newValue)
          }}
        >
          <BottomNavigationAction label="Story Point" icon={<Person />} />
          <BottomNavigationAction label="Tickets" icon={<Feed />} />
          <BottomNavigationAction label="Setting" icon={<Settings />} />
        </BottomNavigation>
      </Paper>
    </main>
  )
}

export default App
