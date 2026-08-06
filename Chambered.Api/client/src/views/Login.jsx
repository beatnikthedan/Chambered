import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../StoreContext'
import './Login.css'

export default function Login() {
  const store = useStore()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      if (store.isInitialized === false) {
        const success = await store.firstRegister(username, password, email)
        if (success) {
          navigate('/')
        }
      } else {
        const success = await store.login(username, password)
        if (success) {
          navigate('/')
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Verification or profile creation failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOidcLogin = () => {
    window.location.href = '/api/auth/oidc/login'
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">
          <span className="brand-emoji">🔥</span>
          <h1 className={`brand-name ${(!store.isInitialized && store.isInitialized !== null) ? 'font-setup' : ''}`}>
            {store.isInitialized ? 'CHAMBERED' : 'CHAMBERED SETUP'}
          </h1>
          <p class="brand-subtitle">
            {store.isInitialized ? 'Precision Armory & Ammunition Server' : 'Register Primary Owner Account'}
          </p>
        </div>

        {!store.isInitialized && store.isInitialized !== null && (
          <div className="setup-banner">
            Welcome! No user profiles found. The first account created will be granted <strong>System Owner (Administrator)</strong> credentials.
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {errorMessage && (
            <div className="error-banner">
              {errorMessage}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. administrator" 
              required 
              disabled={isSubmitting}
            />
          </div>

          {/* Optional email profile field during onboarding */}
          {!store.isInitialized && store.isInitialized !== null && (
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@domain.local" 
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required 
              disabled={isSubmitting}
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="mini-spinner"></span>
            ) : store.isInitialized ? (
              'Access Armory'
            ) : (
              'Initialize Server & Sign In'
            )}
          </button>
        </form>

        {/* SSO connection selectors, hidden on clean setups */}
        {store.isInitialized && (
          <>
            <div className="sso-divider">
              <span>or connect via</span>
            </div>

            <div className="sso-actions">
              <button onClick={handleOidcLogin} className="btn btn-secondary sso-btn">
                <span className="sso-icon"></span>
                <span>Sign In with OIDC Single Sign-On</span>
              </button>
            </div>
          </>
        )}

        <div className="login-footer">
          <p { ... (store.isInitialized ? { 'data-initialized': 'true' } : {}) }>
            {store.isInitialized ? 'Protected by Mixed Casing Authentication' : 'First-run initialization protocol active'}
          </p>
        </div>
      </div>
    </div>
  )
}
