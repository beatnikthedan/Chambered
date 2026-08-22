import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import { StoreProvider } from './StoreContext.jsx'
import './style.css'

// Ensure cross-origin fetch requests include standard session cookies
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  return originalFetch(url, {
    ...options,
    credentials: options.credentials || 'include',
  });
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StoreProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
