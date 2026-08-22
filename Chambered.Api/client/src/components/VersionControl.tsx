import React, { useState, useEffect } from "react";
import "./VersionControl.css";

import {
  useGetVersionCurrentVersion,
  useGetVersionLatestVersionFromPreRelease,
} from "../api/endpoints";

const useApiHealth = (pollIntervalMs = 30000) => {
  const [isApiConnected, setIsApiConnected] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("/health");
        setIsApiConnected(response.ok);
      } catch {
        setIsApiConnected(false);
      }
    };

    checkHealth();
    const intervalId = setInterval(checkHealth, pollIntervalMs);

    return () => clearInterval(intervalId);
  }, [pollIntervalMs]);

  return isApiConnected;
};

export const VersionControl = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);

  const hasUpdate = true; //currentRelease && !currentRelease.isLatest && latestRelease;

  const handleOpenModal = (release) => {
    setSelectedRelease(release);
    setIsModalOpen(true);
  };

  const QUERY_CACHE_OPTIONS = {
    query: {
      staleTime: 1000 * 60 * 15, // Treat data as fresh for 15 minutes (no background refetches)
      gcTime: 1000 * 60 * 30, // Keep in memory for 30 minutes
      refetchOnWindowFocus: false, // Stop refetching every time the user clicks back onto the browser tab
      retry: 1, // Don't hammer the API if it fails once
    },
  };

  const {
    data: currentData,
    isLoading: currentLoading,
    error: currentError,
  } = useGetVersionCurrentVersion(QUERY_CACHE_OPTIONS);

  const currentVersion = currentData?.data;

  const {
    data: latestData,
    isLoading: latestLoading,
    error: latestError,
    refetch: fetchLatest,
  } = useGetVersionLatestVersionFromPreRelease(false, QUERY_CACHE_OPTIONS);

  const latestVersion = latestData?.data;

  const isApiConnected = useApiHealth(30000);

  return (
    <div className="version-control-container">
      {/* Status Bar */}
      <div className="version-status-bar">
        <span
          className={`version-dot ${isApiConnected ? "connected" : "disconnected"}`}
          title={isApiConnected ? "Online" : "Offline"}
        />

        <span className="version-status-text">
          {isApiConnected ? "online" : "offline"}
        </span>

        <span className="version-separator">·</span>

        <button
          onClick={() => handleOpenModal(currentVersion)}
          className="version-link"
        >
          {currentVersion?.tagName}
        </button>
      </div>

      {/* Hidden Banner until an Update is Available */}
      {hasUpdate && (
        <div className="version-update-banner">
          <span>Version </span>
          <button
            onClick={() => {
              handleOpenModal(latestVersion);
              fetchLatest;
            }}
            className="version-banner-link"
          >
            {" "}
            {latestVersion?.tagName}
          </button>
          is available
        </div>
      )}

      {/* Release Info Modal */}
      {isModalOpen && (
        <div
          className="version-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="version-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="version-modal-header">
              <h3>
                {selectedRelease?.name ||
                  selectedRelease?.tagName ||
                  "Release Info"}
              </h3>
              <button
                onClick={() => handleOpenModal(currentVersion)}
                className="version-link"
              >
                {latestVersion?.htmlUrl}
              </button>
              <button
                className="version-close-button"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="version-modal-body">
              <div className="version-modal-date">
                Published:{" "}
                {selectedRelease?.publishedAt
                  ? new Date(selectedRelease.publishedAt).toLocaleDateString()
                  : "N/A"}
              </div>
              <pre className="version-markdown-body">
                {selectedRelease?.body || "No release notes available."}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
