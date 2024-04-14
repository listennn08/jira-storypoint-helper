import { ReactElement, createContext } from 'react'
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  type SelectChangeEvent,
  CircularProgress,
  Typography
} from '@mui/material'
import { Refresh } from '@mui/icons-material'
import { Filter, Ticket } from '@renderer/types'
import useFetchData from '@renderer/hook'
import { useLocation } from 'react-router'

interface TicketContextType {
  tickets: {
    key: string
    boardTitle: string[]
    issues: Ticket[]
  }[]
}

const TicketContext = createContext<TicketContextType>({
  tickets: []
})

export const TicketContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const location = useLocation()
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

  let content: ReactElement | undefined = undefined

  if (location.pathname !== '/settings') {
    if (loading) {
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
        <Typography
          variant="h6"
          textAlign="center"
          component="div"
          width="100%"
          p={2}
          color="error"
        >
          {error}
        </Typography>
      )
    }
  }

  return (
    <TicketContext.Provider value={{ tickets: filteredTickets }}>
      {location.pathname !== '/settings' && (
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
                  <MenuItem value={boardMap[key].name} key={key}>
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

          <IconButton
            sx={{ ml: 'auto' }}
            color="primary"
            onClick={fetchData}
            title="Force update data"
          >
            <Refresh />
          </IconButton>
        </Box>
      )}
      {content ? content : children}
    </TicketContext.Provider>
  )
}

export default TicketContext
