import React, { useState } from "react";

import { useGetSettingsAppriseSettings } from "../api/endpoints";

export default function appriseSettings() {
  const {
    data: appriseData,
    isLoading: appriseLoading,
    error: appriseError,
    refetch: refetchProfile,
  } = useGetSettingsAppriseSettings();

  const appriseSettings = appriseData?.data;

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <h3 className="sec-title">Apprise Integration</h3>
      </div>
      <p className="sec-subtitle">
        Settings for connecting Apprise compatable services for notifications.
        (these settings are readonly).
      </p>

      {appriseLoading ? (
        <div className="loading-spinner-box">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      ) : appriseError ? (
        <div className="vaults-error-card">
          <span className="err-icon">⚠️</span>
          <p>{(appriseError as any)?.message || "Failed to load."}</p>
        </div>
      ) : appriseSettings === null || appriseSettings === undefined ? (
        <div className="empty-state panel">
          <h3>You have no apprise settings configured</h3>
          <p style={{ marginTop: "4px", color: "var(--text-muted)" }}>
            Add apprise settings in the configuration.
          </p>
        </div>
      ) : (
        <div className="policy-card">
          {/* <div className="policy-card-title">Email Configuration Settings</div> */}

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Host</span>
              <span className="policy-sublabel">
                The base URL or direct endpoint of the Apprise API service.
                (e.g., "http://192.168.1.50:8000" or
                "http://apprise.local:8000/notify/my-app-key").
              </span>
            </div>
            <input
              style={{ maxWidth: 400 }}
              type="text"
              value={appriseSettings?.hostUrl || ""}
              readOnly
            />
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Notification Key</span>
              <span className="policy-sublabel">
                Optional notification key/stateless ID used in Apprise API
                endpoints.
              </span>
            </div>
            <input
              style={{ maxWidth: 400 }}
              type="text"
              value={appriseSettings?.notificationKey || ""}
              readOnly
            />
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Target Urls</span>
              <span className="policy-sublabel">
                Optional comma-separated target URLs if using stateless Apprise
                mode (e.g., "pbul://key, discord://webhook_id/webhook_token").
              </span>
            </div>
            <input
              style={{ maxWidth: 400 }}
              type="text"
              value={appriseSettings?.targetUrls || ""}
              readOnly
            />
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Timeout Seconds</span>
              <span className="policy-sublabel">
                The request timeout in seconds. Defaults to 10 seconds.
              </span>
            </div>
            <input
              style={{ maxWidth: 400 }}
              type="number"
              value={appriseSettings?.timeoutSeconds || 10}
              readOnly
            />
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Allow Invalid Certificates</span>
              <span className="policy-sublabel">
                Indicating whether SSL certificate validation errors should be
                ignored. Keep disabled in production.
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={appriseSettings?.allowInvalidCertificates || false}
                readOnly
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
