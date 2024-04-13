import './assets/main.css'

import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material'
import { CssBaseline } from '@mui/material'
import App from './App'
import { AppContextProvider } from './context/AppContext'

const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  },
  typography: {
    fontWeightRegular: 500
  }
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ThemeProvider theme={darkTheme}>
    <AppContextProvider>
      <CssBaseline />
      <App />
    </AppContextProvider>
  </ThemeProvider>
)
