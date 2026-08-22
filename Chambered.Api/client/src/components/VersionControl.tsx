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

  const handleOpenModal = (release) => {
    setSelectedRelease(release);
    setIsModalOpen(true);
  };

  const QUERY_CACHE_OPTIONS = {
    query: {
      staleTime: 1000 * 60 * 15,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  };

  const {
    data: currentData,
    isLoading: currentLoading,
    error: currentError,
  } = useGetVersionCurrentVersion(undefined, QUERY_CACHE_OPTIONS);

  const currentVersion = currentData?.data;

  const {
    data: latestData,
    isLoading: latestLoading,
    error: latestError,
    refetch: fetchLatest,
  } = useGetVersionLatestVersionFromPreRelease(
    false,
    undefined,
    QUERY_CACHE_OPTIONS,
  );

  const latestVersion = latestData?.data;

  const isApiConnected = useApiHealth(30000);

  const hasUpdate = currentVersion && !currentVersion.isLatest && latestVersion;

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

        {currentVersion && (
          <div>
            <span className="version-separator">·</span>

            <button
              onClick={() => handleOpenModal(currentVersion)}
              className="version-link"
            >
              {currentVersion?.tagName}
            </button>
          </div>
        )}
      </div>

      {/* Hidden Banner until an Update is Available */}
      {hasUpdate && (
        <div className="version-update-banner">
          <span>Version </span>
          <button
            onClick={() => {
              handleOpenModal(latestVersion);
              fetchLatest();
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
              <div className="version-modal-title-group">
                <h3>
                  {selectedRelease?.name ||
                    selectedRelease?.tagName ||
                    "Release Info"}
                </h3>
                {selectedRelease?.htmlUrl && (
                  <a
                    href={selectedRelease.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="version-link"
                  >
                    View on GitHub
                  </a>
                )}
              </div>

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
