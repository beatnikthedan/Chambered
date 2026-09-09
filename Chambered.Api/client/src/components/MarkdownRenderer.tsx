import React, { useMemo } from "react";

export interface MarkdownRendererProps {
  content?: string | null;
  className?: string;
  placeholder?: string;
}

export default function MarkdownRenderer({
  content,
  className = "markdown-body-render",
  placeholder = "No notes recorded.",
}: MarkdownRendererProps) {
  const renderedElements = useMemo(() => {
    if (!content || !content.trim()) {
      return <p className="text-muted">{placeholder}</p>;
    }

    const lines = content.split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let i = 0;

    const renderInline = (text: string): React.ReactNode[] => {
      // Parse code, bold, italic, strikethrough, links
      const parts: React.ReactNode[] = [];
      let remaining = text;
      let key = 0;

      while (remaining.length > 0) {
        // Inline code: `code`
        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
          parts.push(
            <code
              key={key++}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "12px",
                color: "var(--color-primary, #cca43b)",
              }}
            >
              {codeMatch[1]}
            </code>
          );
          remaining = remaining.slice(codeMatch[0].length);
          continue;
        }

        // Bold: **text** or __text__
        const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
        if (boldMatch) {
          parts.push(
            <strong key={key++} style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              {renderInline(boldMatch[2])}
            </strong>
          );
          remaining = remaining.slice(boldMatch[0].length);
          continue;
        }

        // Italic: *text* or _text_
        const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
        if (italicMatch) {
          parts.push(
            <em key={key++} style={{ fontStyle: "italic", color: "var(--text-primary)" }}>
              {renderInline(italicMatch[2])}
            </em>
          );
          remaining = remaining.slice(italicMatch[0].length);
          continue;
        }

        // Strikethrough: ~~text~~
        const strikeMatch = remaining.match(/^~~(.*?)~~/);
        if (strikeMatch) {
          parts.push(
            <del key={key++} style={{ textDecoration: "line-through" }}>
              {renderInline(strikeMatch[1])}
            </del>
          );
          remaining = remaining.slice(strikeMatch[0].length);
          continue;
        }

        // Plain text up to next special char
        const nextSpecial = remaining.search(/[`*_~]/);
        if (nextSpecial === -1) {
          parts.push(remaining);
          break;
        } else if (nextSpecial === 0) {
          parts.push(remaining[0]);
          remaining = remaining.slice(1);
        } else {
          parts.push(remaining.slice(0, nextSpecial));
          remaining = remaining.slice(nextSpecial);
        }
      }

      return parts;
    };

    while (i < lines.length) {
      const line = lines[i];

      // Blank line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Code Block: ```
      if (line.trim().startsWith("```")) {
        const lang = line.trim().replace(/^```/, "");
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // consume closing ```
        elements.push(
          <pre
            key={`code-${i}`}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "12px",
              overflowX: "auto",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "12px",
              margin: "8px 0",
            }}
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        continue;
      }

      // Headings: #, ##, ###, ####
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const headingStyles: React.CSSProperties = {
          margin: "12px 0 6px 0",
          color: "var(--text-primary)",
          fontWeight: 700,
        };
        if (level === 1) {
          elements.push(
            <h2 key={`h-${i}`} style={{ ...headingStyles, fontSize: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
              {renderInline(text)}
            </h2>
          );
        } else if (level === 2) {
          elements.push(
            <h3 key={`h-${i}`} style={{ ...headingStyles, fontSize: "17px" }}>
              {renderInline(text)}
            </h3>
          );
        } else if (level === 3) {
          elements.push(
            <h4 key={`h-${i}`} style={{ ...headingStyles, fontSize: "15px" }}>
              {renderInline(text)}
            </h4>
          );
        } else {
          elements.push(
            <h5 key={`h-${i}`} style={{ ...headingStyles, fontSize: "13px" }}>
              {renderInline(text)}
            </h5>
          );
        }
        i++;
        continue;
      }

      // Horizontal Rule: --- or ***
      if (/^(\-{3,}|\*{3,})$/.test(line.trim())) {
        elements.push(
          <hr
            key={`hr-${i}`}
            style={{
              borderColor: "var(--border-color)",
              borderStyle: "solid",
              borderWidth: "1px 0 0 0",
              margin: "16px 0",
            }}
          />
        );
        i++;
        continue;
      }

      // Blockquote: > text
      if (line.trim().startsWith(">")) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) {
          quoteLines.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        elements.push(
          <blockquote
            key={`quote-${i}`}
            style={{
              borderLeft: "3px solid var(--color-primary)",
              paddingLeft: "12px",
              margin: "8px 0",
              color: "var(--text-secondary)",
              fontStyle: "italic",
            }}
          >
            {quoteLines.map((ql, qidx) => (
              <p key={qidx} style={{ margin: "4px 0" }}>
                {renderInline(ql)}
              </p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Unordered List: - or *
      if (/^[\*\-]\s+/.test(line.trim())) {
        const listItems: string[] = [];
        while (i < lines.length && /^[\*\-]\s+/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^[\*\-]\s+/, ""));
          i++;
        }
        elements.push(
          <ul
            key={`ul-${i}`}
            style={{
              paddingLeft: "20px",
              margin: "8px 0",
              lineHeight: 1.6,
            }}
          >
            {listItems.map((item, idx) => (
              <li key={idx} style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered List: 1. item
      if (/^\d+\.\s+/.test(line.trim())) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
          i++;
        }
        elements.push(
          <ol
            key={`ol-${i}`}
            style={{
              paddingLeft: "20px",
              margin: "8px 0",
              lineHeight: 1.6,
            }}
          >
            {listItems.map((item, idx) => (
              <li key={idx} style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Table: | col | col |
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [];
        while (
          i < lines.length &&
          lines[i].trim().startsWith("|") &&
          lines[i].trim().endsWith("|")
        ) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerCols = tableLines[0]
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim());
          // check if row 1 is separator |---|---|
          const hasSeparator = /^\|?(\s*:?-+:?\s*\|)+$/.test(tableLines[1]);
          const dataRowLines = hasSeparator ? tableLines.slice(2) : tableLines.slice(1);

          elements.push(
            <div
              key={`table-wrap-${i}`}
              style={{ overflowX: "auto", margin: "12px 0" }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                    {headerCols.map((col, cIdx) => (
                      <th
                        key={cIdx}
                        style={{
                          padding: "8px 12px",
                          borderBottom: "2px solid var(--border-color)",
                          borderRight: "1px solid var(--border-color)",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {renderInline(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRowLines.map((rowLine, rIdx) => {
                    const rowCols = rowLine
                      .split("|")
                      .slice(1, -1)
                      .map((c) => c.trim());
                    return (
                      <tr
                        key={rIdx}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          backgroundColor:
                            rIdx % 2 === 1
                              ? "rgba(255, 255, 255, 0.02)"
                              : "transparent",
                        }}
                      >
                        {rowCols.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            style={{
                              padding: "6px 12px",
                              borderRight: "1px solid var(--border-color)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Regular Paragraph
      elements.push(
        <p
          key={`p-${i}`}
          style={{
            margin: "6px 0",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
          }}
        >
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return elements;
  }, [content, placeholder]);

  return <div className={className}>{renderedElements}</div>;
}
