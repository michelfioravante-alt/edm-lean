import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'
import { useAuthStore } from './store/useAuthStore'
import './index.css'

if (typeof window !== 'undefined') {
    window.useAuthStore = useAuthStore;
}


ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
)
