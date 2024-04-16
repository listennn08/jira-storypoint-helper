import { Outlet, useLocation, useNavigate } from 'react-router'
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Alert,
  AlertTitle
} from '@mui/material'
import { Feed, Person, Settings } from '@mui/icons-material'

import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import { useAppStore } from './store/appStore'
import { TicketContextProvider } from './context/TicketContext'

export const App = (): JSX.Element => {
  const location = useLocation()
  const navigate = useNavigate()
  const appStore = useAppStore()
  const alerts = appStore.alerts

  return (
    <main>
      <Box sx={{ mb: 6, p: 2, minHeight: 'calc(100vh - 56px)' }}>
        <TicketContextProvider>
          <Outlet />
        </TicketContextProvider>
      </Box>

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999 }}>
        <BottomNavigation
          showLabels
          value={location.pathname}
          onChange={(_event, newValue) => {
            navigate(newValue)
          }}
        >
          <BottomNavigationAction label="Story Point" value="/" icon={<Person />} />
          <BottomNavigationAction label="Tickets" value="/tickets" icon={<Feed />} />
          <BottomNavigationAction label="Setting" value="/settings" icon={<Settings />} />
        </BottomNavigation>
      </Paper>

      {alerts.map((alert, index) => (
        <Alert
          key={alert.message + index}
          severity={alert.severity}
          sx={{
            position: 'fixed',
            top: `${1 + index * 4}rem`,
            right: '1rem'
          }}
        >
          <AlertTitle>{alert.message}</AlertTitle>
        </Alert>
      ))}
    </main>
  )
}

export default App
