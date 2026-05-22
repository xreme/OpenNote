import { createContext, useContext, useState, useEffect } from "react";
import rawAxios from "axios";

const PreviewContext = createContext(false);

export function PreviewProvider({ children }) {
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    rawAxios
      .get("/api/preview-status")
      .then((res) => setPreviewMode(res.data.previewMode === true))
      .catch(() => {});
  }, []);

  return (
    <PreviewContext.Provider value={previewMode}>
      {children}
    </PreviewContext.Provider>
  );
}

export default function usePreviewMode() {
  return useContext(PreviewContext);
}
