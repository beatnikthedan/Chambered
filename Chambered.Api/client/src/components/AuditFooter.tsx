import React from "react";

export interface AuditFooterProps {
  created?: string | null;
  createdBy?: string | null;
  modified?: string | null;
  modifiedBy?: string | null;
}

export default function AuditFooter({
  created,
  createdBy,
  modified,
  modifiedBy,
}: AuditFooterProps) {
  if (!created && !createdBy && !modified && !modifiedBy) {
    return null;
  }

  const formatAuditDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="audit-footer-card">
      <div className="audit-footer-item">
        <span className="audit-footer-label">Created</span>
        <span className="audit-footer-value">
          {formatAuditDate(created)}
          {createdBy && <span className="audit-footer-user"> by {createdBy}</span>}
        </span>
      </div>

      {(modified || modifiedBy) && (
        <div className="audit-footer-item">
          <span className="audit-footer-label">Last Modified</span>
          <span className="audit-footer-value">
            {formatAuditDate(modified)}
            {modifiedBy && <span className="audit-footer-user"> by {modifiedBy}</span>}
          </span>
        </div>
      )}
    </div>
  );
}

