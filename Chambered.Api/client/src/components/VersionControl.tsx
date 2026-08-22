import React, { useState } from "react";
import "./VersionControl.css";

export const VersionControl = ({
  isApiConnected = true,
  environment = "docker",
  currentRelease = null,
  latestRelease = null,
  onFetchLatest = null,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);

  const hasUpdate = true; //currentRelease && !currentRelease.isLatest && latestRelease;

  //   const handleOpenModal = (release) => {
  //     setSelectedRelease(release);
  //     setIsModalOpen(true);
  //   };

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
          //   onClick={() => handleOpenModal(currentRelease)}
          className="version-link"
        >
          {/* {currentRelease?.tagName || "v1.0.0.0"} */}
          v1.0.0
        </button>
      </div>

      {/* Hidden Banner until an Update is Available */}
      {hasUpdate && (
        <div className="version-update-banner">
          <span>Version </span>
          <button
            // onClick={() => {
            //   handleOpenModal(latestRelease);
            //   if (onFetchLatest) onFetchLatest();
            // }}
            className="version-banner-link"
          >
            {" "}
            {/* {latestRelease.tagName} ({latestRelease.name}) */}
            v1.1.2
          </button>
          is available
        </div>
      )}

      {/* Release Info Modal */}
      {/* {isModalOpen && (
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
      )} */}
    </div>
  );
};
