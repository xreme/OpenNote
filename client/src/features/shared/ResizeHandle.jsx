import React from "react";

// direction: 1  = handle expands panel on its LEFT (panel is to the left)
//            -1 = handle expands panel on its RIGHT (panel is to the right)
export default function ResizeHandle({ onMouseDown, direction = 1, active = false }) {
  return (
    <div
      className={`resize-handle ${active ? "active" : ""}`}
      onMouseDown={(e) => onMouseDown(e, direction)}
    />
  );
}
