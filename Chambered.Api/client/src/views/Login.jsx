import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../StoreContext";
import {
  postUsersRegister,
  useGetAccountConfiguredProviders,
  getGetAccountPrepareChallengeUrl,
  useGetSettingsLoginSettings,
} from "../api/endpoints";
import "./Login.css";
import "../components/VersionControl.tsx";
import { VersionControl } from "../components/VersionControl.tsx";

export default function Login() {
  const store = useStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [mode, setMode] = useState(() => {
    if (store.isInitialized === false) return "setup";
    return "login";
  });

  // Synchronize dynamic setup mode if store loads initialized state asynchronously
  useEffect(() => {
    if (store.isInitialized === false) {
      setMode("setup");
    } else if (store.isInitialized === true && mode === "setup") {
      setMode("login");
    }
  }, [store.isInitialized, mode]);

  // Simple real-time password strength validation score: 0 to 4
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", className: "" };
    let score = 1;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const finalScore = Math.min(score, 4);
    let label = "Weak";
    let className = "weak";
    if (finalScore === 2) {
      label = "Fair";
      className = "fair";
    } else if (finalScore === 3) {
      label = "Good";
      className = "good";
    } else if (finalScore === 4) {
      label = "Strong";
      className = "strong";
    }
    return { score: finalScore, label, className };
  };

  const pwdStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "setup") {
        const success = await store.firstRegister(username, password, email);
        if (success) {
          navigate("/");
        }
      } else if (mode === "login") {
        const success = await store.login(username, password);
        if (success) {
          navigate("/");
        }
      } else if (mode === "register") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (pwdStrength.score < 2) {
          throw new Error("Please choose a stronger password.");
        }

        try {
          const res = await postUsersRegister({
            username,
            email,
            password,
            firstName: username,
            lastName: "",
          });

          if (res.status === 200 || res.status === 201) {
            const loginSuccess = await store.login(username, password);
            if (loginSuccess) navigate("/");
          } else {
            throw new Error(
              res.data?.detail ||
                "Registration is restricted by administrators.",
            );
          }
        } catch (err) {
          throw new Error(
            err.message ||
              "Self-registration is restricted. Please contact your administrator.",
          );
        }
      }
    } catch (err) {
      setErrorMessage(
        err.message || "Authentication or profile creation failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    data: loginResponse,
    isLoading: loginLoading,
    error: loginError,
  } = useGetSettingsLoginSettings();

  const loginPolicy = loginResponse?.data;

  // Fetch configured providers from the backend (/api/v1/Account/providers)
  const { data: providersResponse } = useGetAccountConfiguredProviders();
  const oidcProviders = providersResponse?.data || [];

  const handleOidcLogin = (providerName) => {
    const redirectUri = `${window.location.origin}/`;

    // Dynamically build the versioned URL using Orval's generated builder function
    const challengeUrl = getGetAccountPrepareChallengeUrl({
      providerName,
      redirectUri,
    });

    window.location.href = challengeUrl;
  };

  const localLoginEnabled = store.localLoginEnabled !== false;

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Sleek Dynamic Brand Header */}
        <div className="brand">
          <span className="brand-emoji">🛡️</span>
          {mode === "setup" ? (
            <>
              <h1 className="brand-name font-setup">CHAMBERED</h1>
              <p className="brand-subtitle">First-run setup · step 1 of 1</p>
            </>
          ) : mode === "register" ? (
            <>
              <h1 className="brand-name">CHAMBERED</h1>
              <p className="brand-subtitle">Create your new user account</p>
            </>
          ) : (
            <>
              <h1 className="brand-name">CHAMBERED</h1>
              <p className="brand-subtitle">
                Precision armory & ammunition server
              </p>
            </>
          )}
        </div>

        {/* Informative Banner for Setup Onboarding */}
        {mode === "setup" && (
          <div className="setup-banner">
            No profiles found. This first account becomes{" "}
            <strong>System Owner</strong> with full administrative rights.
          </div>
        )}

        {errorMessage && (
          <div className="error-banner" style={{ marginBottom: "20px" }}>
            {errorMessage}
          </div>
        )}

        {!loginPolicy?.disableLocalUsers ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  mode === "setup" ? "e.g. administrator" : "administrator"
                }
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Email field (only in Setup and Register modes) */}
            {(mode === "setup" || mode === "register") && (
              <div className="form-group">
                <label htmlFor="email">
                  Email Address {mode === "setup" && "· optional"}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@domain.local"
                  required={mode === "register"}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div className="form-group">
              <div className="form-group-header">
                <label htmlFor="password">Password</label>
                {mode === "login" && (
                  <a
                    href="#forgot"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        "Please contact your administrator to reset your credentials.",
                      );
                    }}
                    className="forgot-password-link"
                  >
                    Forgot?
                  </a>
                )}
              </div>
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

            {/* Reactive Segmented Strength Indicator for Setup and Register */}
            {(mode === "setup" || mode === "register") && (
              <div className="password-strength">
                <div className="password-strength-bar">
                  <div
                    className={`strength-segment ${pwdStrength.score >= 1 ? `active-${pwdStrength.className}` : ""}`}
                  />
                  <div
                    className={`strength-segment ${pwdStrength.score >= 2 ? `active-${pwdStrength.className}` : ""}`}
                  />
                  <div
                    className={`strength-segment ${pwdStrength.score >= 3 ? `active-${pwdStrength.className}` : ""}`}
                  />
                  <div
                    className={`strength-segment ${pwdStrength.score >= 4 ? `active-${pwdStrength.className}` : ""}`}
                  />
                </div>
                {password && pwdStrength.label && (
                  <div className={`strength-text ${pwdStrength.className}`}>
                    {pwdStrength.label}
                  </div>
                )}
              </div>
            )}

            {/* Password confirmation for Register mode */}
            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="mini-spinner"></span>
              ) : mode === "setup" ? (
                "Initialize server & sign in"
              ) : mode === "register" ? (
                "Create Account & Sign In"
              ) : (
                "Access Armory"
              )}
            </button>
          </form>
        ) : (
          <div
            className="setup-banner"
            style={{
              margin: "0 0 20px 0",
              border: "1px dashed rgba(255, 255, 255, 0.1)",
            }}
          >
            Local authentication is disabled. Please authenticate using OIDC
            Single Sign-On below.
          </div>
        )}

        {/* Dynamic SSO Buttons Section */}
        {mode === "login" && oidcProviders.length > 0 && (
          <>
            <div className="sso-divider">
              <span>or connect via</span>
            </div>

            <div
              className="sso-actions"
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {oidcProviders.map((providerName) => (
                <button
                  key={providerName}
                  onClick={() => handleOidcLogin(providerName)}
                  className="btn btn-secondary sso-btn"
                  disabled={isSubmitting}
                >
                  <span>{providerName}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Seamless Navigation Mode Toggles */}
        {store.isInitialized && (
          <div className="auth-toggle-container">
            {mode === "login" ? (
              !loginPolicy?.disableNewUserRegistration && (
                <>
                  New user?
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setMode("register");
                    }}
                    className="auth-toggle-link"
                  >
                    Create an account
                  </button>
                </>
              )
            ) : (
              <>
                Already have an account?
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setMode("login");
                  }}
                  className="auth-toggle-link"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        )}

        {/* System Version Footer */}
        <div className="login-footer">
          <p>
            {mode === "setup" ? (
              "First-run initialization protocol active"
            ) : (
              <>
                <VersionControl />
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
