import React, { useState } from "react";

import { useGetSettingsEmailSettings } from "../api/endpoints";

export default function EmailSettings() {
  const {
    data: emailData,
    isLoading: emailLoading,
    error: emailError,
    refetch: refetchProfile,
  } = useGetSettingsEmailSettings();

  const emailSettings = emailData?.data;

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <h3 className="sec-title">Email Integration</h3>
      </div>
      <p className="sec-subtitle">
        Settings for connecting external email provider or smtp relay service
        (thse settings are readonly).
      </p>

      {emailLoading ? (
        <div className="loading-spinner-box">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      ) : emailError ? (
        <div className="vaults-error-card">
          <span className="err-icon">⚠️</span>
          <p>{(emailError as any)?.message || "Failed to load."}</p>
        </div>
      ) : emailSettings === null || emailSettings === undefined ? (
        <div className="empty-state panel">
          <h3>You have no email settings configured</h3>
          <p style={{ marginTop: "4px", color: "var(--text-muted)" }}>
            Add email settings in the configuration.
          </p>
        </div>
      ) : (
        <div className="policy-card">
          {/* <div className="policy-card-title">Email Configuration Settings</div> */}

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Host</span>
              <span className="policy-sublabel">
                SMTP server host name or IP address (e.g., "in-v3.mailjet.com"
                or "192.168.1.50").
              </span>
            </div>
            <input
              style={{ maxWidth: 400 }}
              type="text"
              value={emailSettings?.host || ""}
              readOnly
            />
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Port</span>
              <span className="policy-sublabel">
                The port number. Common ports are 25, 465 (Implicit SSL), 587
                (STARTTLS), or 1025 (Local dev).
              </span>
            </div>
            <input
              style={{ maxWidth: 400 }}
              type="number"
              value={emailSettings?.port || 0}
              readOnly
            />
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">User Name</span>
              <span className="policy-sublabel">
                Username used for SMTP authentication.
              </span>
            </div>
            <input
              style={{ maxWidth: 400 }}
              type="text"
              value={emailSettings?.userName || ""}
              readOnly
            />
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Has Password</span>
              <span className="policy-sublabel">
                Has SMTP authentication password or API secret
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={emailSettings?.hasPassword || false}
                readOnly
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Security Option</span>
              <span className="policy-sublabel">
                SSL/TLS socket security option for the connection.
              </span>
            </div>
            <input
              style={{ maxWidth: 400 }}
              type="text"
              value={emailSettings?.securityOption || ""}
              readOnly
            />
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Allow Invalid Certificates</span>
              <span className="policy-sublabel">
                Enable this option for homelab environments, local development
                servers. Keep disabled in production.
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={emailSettings?.hasPassword || false}
                readOnly
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Default From Address</span>
              <span className="policy-sublabel">Default sender address.</span>
            </div>
            <input
              style={{ maxWidth: 400 }}
              type="text"
              value={emailSettings?.defaultFromAddress || ""}
              readOnly
            />
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Default Display Name</span>
              <span className="policy-sublabel">
                Default display name for emails.
              </span>
            </div>
            <input
              style={{ maxWidth: 400 }}
              type="text"
              value={emailSettings?.defaultFromDisplayName || ""}
              readOnly
            />
          </div>
        </div>
      )}
    </section>
  );
}
