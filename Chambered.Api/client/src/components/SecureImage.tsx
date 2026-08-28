import React, { useState, useEffect } from "react";

/**
 * Custom React hook to fetch cookie-authenticated, decrypted file streams
 * as a local blob URL for inline rendering, bypassing content-disposition attachment.
 */
export function useSecureImage(src: string | null | undefined): string {
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    if (!src) {
      setBlobUrl("");
      return;
    }

    let isMounted = true;

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error("Secure image load failed");
        return res.blob();
      })
      .then((blob) => {
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBlobUrl("");
        }
      });

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src]);

  return blobUrl;
}

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * Renders a secure image thumbnail using automated same-origin session authentication.
 */
export default function SecureImage({ src, alt, style, ...props }: SecureImageProps) {
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error: " + res.status);
        return res.blob();
      })
      .then((blob) => {
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div
        style={{
          ...style,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-input)",
          color: "var(--text-muted)",
          fontSize: "11px",
        }}
      >
        ⏳
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div
        style={{
          ...style,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-input)",
          color: "var(--text-muted)",
          fontSize: "11px",
        }}
      >
        🖼️
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} style={style} {...props} />;
}
