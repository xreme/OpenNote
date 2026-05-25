import { createContext, useContext, useState, useEffect } from "react";
import rawAxios from "axios";

const PreviewContext = createContext({ previewMode: false, loaded: false });

export function PreviewProvider({ children }) {
  const [status, setStatus] = useState({ previewMode: false, loaded: false });

  useEffect(() => {
    rawAxios
      .get("/api/preview-status")
      .then((res) => setStatus({ previewMode: res.data.previewMode === true, loaded: true }))
      .catch(() => setStatus({ previewMode: false, loaded: true }));
  }, []);

  return (
    <PreviewContext.Provider value={status}>
      {children}
    </PreviewContext.Provider>
  );
}

export default function usePreviewMode() {
  return useContext(PreviewContext).previewMode;
}

export function usePreviewModeLoaded() {
  return useContext(PreviewContext).loaded;
}
