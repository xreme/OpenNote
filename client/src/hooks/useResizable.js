import { useState, useRef, useEffect, useCallback } from "react";

export default function useResizable({ key, defaultWidth, minWidth = 160, maxWidth = 640 }) {
  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem(`resize-${key}`);
    return stored ? parseInt(stored, 10) : defaultWidth;
  });
  const [isResizing, setIsResizing] = useState(false);
  const drag = useRef({ startX: 0, startWidth: 0, direction: 1 });

  // direction: 1 = handle is on right edge of panel (drag right = wider)
  //           -1 = handle is on left edge of panel (drag left = wider)
  const onMouseDown = useCallback(
    (e, direction = 1) => {
      e.preventDefault();
      drag.current = { startX: e.clientX, startWidth: width, direction };
      setIsResizing(true);
    },
    [width]
  );

  useEffect(() => {
    if (!isResizing) return;

    let live = drag.current.startWidth;

    const onMouseMove = (e) => {
      const delta = (e.clientX - drag.current.startX) * drag.current.direction;
      live = Math.max(minWidth, Math.min(maxWidth, drag.current.startWidth + delta));
      setWidth(live);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem(`resize-${key}`, String(Math.round(live)));
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing, key, minWidth, maxWidth]);

  return { width, isResizing, onMouseDown };
}
