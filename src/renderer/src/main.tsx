import './assets/main.css'

import ReactDOM from 'react-dom/client'
import { Route, RouterProvider, createRoutesFromElements } from 'react-router'
import { createHashRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App'
import { AppContextProvider } from './context/AppContext'

import Index from './pages/index'
import Tickets from './pages/tickets'
import SettingsPage from './pages/settings'

const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  },
  typography: {
    fontWeightRegular: 500
  }
})

const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route path="/" element={<Index />} />,
      <Route path="/tickets" element={<Tickets />} />,
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
  )
)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ThemeProvider theme={darkTheme}>
    <AppContextProvider>
      <CssBaseline />
      <RouterProvider router={router} />
    </AppContextProvider>
  </ThemeProvider>
)
