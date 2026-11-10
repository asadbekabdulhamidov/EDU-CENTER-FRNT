import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { StoreProvider } from './store/StoreContext'
import AntdProvider from './components/AntdProvider'
import { getLang, setLang } from './i18n'
import './styles.css'

setLang(getLang())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <AntdProvider>
        <App />
      </AntdProvider>
    </StoreProvider>
  </React.StrictMode>,
)
