import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProductsProductDocumentsFromKey,
  usePutProductDocumentsFromKey,
  useDeleteProductDocumentsFromKey,
  getGetProductsProductDocumentsFromKeyQueryKey,
} from "../api/endpoints";
import SecureImage from "./SecureImage";

import { useStore } from "../StoreContext";

interface ProductDocumentsTableProps {
  productId: number;
  readOnly?: boolean;
}

export default function ProductDocumentsTable({ productId, readOnly = false }: ProductDocumentsTableProps) {
  const queryClient = useQueryClient();
  const store = useStore();
  const { enums } = store || {};
  const documentTypes = enums?.documentTypes || [];

  const getDocumentTypeLabel = (typeVal: string | number) => {
    const option = documentTypes.find(
      (opt) => opt.id === String(typeVal) || opt.name === String(typeVal)
    );
    return option ? option.label : String(typeVal);
  };

  const [docType, setDocType] = useState<string>("OwnerManual");

  const formatBytes = (bytes: number | undefined) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const {
    data: documentsData,
    isLoading: isQueryLoading,
    error: queryError,
    isError: isQueryError,
  } = useGetProductsProductDocumentsFromKey(productId, undefined, {
    query: {
      enabled: !!productId && productId > 0,
    },
  });

  const rawData = documentsData?.data;
  const documents = Array.isArray(rawData)
    ? rawData
    : (rawData as any)?.value || [];

  const refreshDocumentsList = () => {
    queryClient.invalidateQueries({
      queryKey: getGetProductsProductDocumentsFromKeyQueryKey(productId),
    });
  };

  const { mutate: uploadDoc, isPending: isUploading } =
    usePutProductDocumentsFromKey({
      mutation: {
        onSuccess: () => {
          alert("Document uploaded successfully!");
          refreshDocumentsList();
        },
        onError: (err: any) => {
          alert(`Upload failed: ${err?.message || "Internal server error"}`);
        },
      },
    });

  const { mutate: deleteDoc, isPending: isDeleting } =
    useDeleteProductDocumentsFromKey({
      mutation: {
        onSuccess: () => {
          alert("Document permanently deleted.");
          refreshDocumentsList();
        },
        onError: (err: any) => {
          alert(`Delete failed: ${err?.message || "Internal server error"}`);
        },
      },
    });

  const handleUploadFileImmediate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDoc({
        key: productId,
        data: {
          file: file,
          type: docType,
        },
      });
    }
  };

  const handleDelete = (docId: number, fileName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete document "${fileName}"?`)) {
      deleteDoc({ key: docId });
    }
  };

  const handleDownload = async (docId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/v1/ProductDocuments(${docId})/Download`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = blobUrl;
      tempLink.setAttribute("download", fileName);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await fetch(`/api/v1/ProductDocuments/DownloadAll(parentId=${productId})`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = blobUrl;
      tempLink.setAttribute("download", `product_${productId}_documents.zip`);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className="product-documents-section" style={{ marginTop: "1.5rem" }}>
      {/* HEADER: TITLE & HORIZONTAL ACTION CONTROLS */}
      <div
        className="sec-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-primary)" }}>
            Product Attachments
          </h3>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {!readOnly && (
            <>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "0 12px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  height: "38px",
                  boxSizing: "border-box",
                }}
              >
                {documentTypes.map((opt) => (
                  <option key={opt.id} value={opt.name}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <label
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: 0,
                  cursor: "pointer",
                  padding: "0 14px",
                  fontSize: "13px",
                  height: "38px",
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                }}
              >
                {isUploading ? "Uploading..." : "Upload Document"}
                <input
                  type="file"
                  onChange={handleUploadFileImmediate}
                  disabled={isUploading}
                  style={{ display: "none" }}
                />
              </label>
            </>
          )}

          {documents.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleDownloadAll}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 14px",
                fontSize: "13px",
                height: "38px",
                boxSizing: "border-box",
                whiteSpace: "nowrap",
              }}
            >
              Download All (ZIP)
            </button>
          )}
        </div>
      </div>

      {/* TABLE & STATES VIEW */}
      {isQueryLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading documents...</span>
        </div>
      ) : isQueryError ? (
        <div style={{ padding: "16px", backgroundColor: "rgba(255, 82, 82, 0.05)", border: "1px solid #ff5252", borderRadius: "var(--radius-md)" }}>
          <p style={{ margin: 0, color: "#ff5252", fontSize: "13px" }}>
            ⚠️ Failed to retrieve attachments: {(queryError as any)?.message || "OData Database Query Error"}
          </p>
        </div>
      ) : documents.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", backgroundColor: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
            No documents or pictures are currently attached to this catalog product.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="app-table" style={{ width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Document File</th>
                <th style={{ width: "18%" }}>Type</th>
                <th style={{ width: "12%" }}>Size</th>
                <th style={{ width: "15%" }}>Uploaded</th>
                <th style={{ width: "12%", textAlign: "center" }}>Encrypted</th>
                <th style={{ width: "8%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d: any) => (
                <tr key={d.id}>
                  <td className="text-bold text-mono" style={{ wordBreak: "break-all", width: "35%", verticalAlign: "middle" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {(() => {
                        const typeStr = String(d.type || "").toLowerCase();
                        if (typeStr === "productimage" || typeStr === "6" || typeStr === "5") return true;
                        const opt = documentTypes.find(o => o.id === typeStr || o.name?.toLowerCase() === typeStr);
                        return opt ? opt.name?.toLowerCase() === "productimage" : false;
                      })() ? (
                        <SecureImage
                          src={`/api/v1/ProductDocuments/${d.id}/Download`}
                          alt={d.fileName}
                          style={{
                            width: "32px",
                            height: "32px",
                            objectFit: "cover",
                            borderRadius: "var(--radius-sm, 4px)",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--bg-input)",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "16px", minWidth: "32px", textAlign: "center", display: "inline-block" }}>📄</span>
                      )}
                      <span>{d.fileName}</span>
                    </div>
                  </td>
                  <td style={{ width: "18%" }}>
                    <span className="type-badge-pill" style={{ fontSize: "10px", padding: "2px 8px" }}>
                      {getDocumentTypeLabel(d.type)}
                    </span>
                  </td>
                  <td style={{ width: "12%" }}>{formatBytes(d.fileSizeBytes)}</td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)", width: "15%" }}>
                    {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td style={{ width: "12%", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={!!d.isEncrypted}
                      readOnly
                      style={{
                        width: "14px",
                        height: "14px",
                        accentColor: "var(--accent-color, #1e90ff)",
                        cursor: "default",
                      }}
                    />
                  </td>
                  <td style={{ width: "8%" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn-icon"
                        title="Download File"
                        onClick={() => handleDownload(d.id, d.fileName)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "inherit",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>

                      {!readOnly && (
                        <button
                          className="btn-icon"
                          title="Delete File"
                          onClick={() => handleDelete(d.id, d.fileName)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ff5252",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          disabled={isDeleting}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
