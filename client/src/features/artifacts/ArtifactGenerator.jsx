import React, { useState } from "react";
import { Loader2, Sparkles, Pencil } from "lucide-react";
import { ARTIFACT_TYPES } from "../../constants/artifacts";

// Inline "I want to make [dropdown]" generator control.
// Shared by the desktop Generate Artifact modal and the per-video artifact tab.
export default function ArtifactGenerator({
  generating,
  disabled,
  onGenerate,
  buttonLabel = "Generate",
  buttonClassName = "save-btn",
  buttonStyle,
  className = "",
  includeBlankNote = false,
}) {
  const [artifactType, setArtifactType] = useState("summary");
  const [customPrompt, setCustomPrompt] = useState("");

  // "a blank note" is only relevant when generating for a single video.
  const options = ARTIFACT_TYPES.filter((t) => t.value !== "note" || includeBlankNote);

  const isCustom = artifactType === "custom";
  const isBlankNote = artifactType === "note";
  const canGenerate =
    !disabled && !generating && (!isCustom || customPrompt.trim().length > 0);

  const handleGenerate = () => {
    if (!canGenerate) return;
    onGenerate(artifactType, isCustom ? customPrompt.trim() : "");
  };

  const Icon = isBlankNote ? Pencil : Sparkles;
  const label = isBlankNote ? "Create note" : buttonLabel;

  return (
    <div className={`artifact-generator ${className}`.trim()}>
      <div className="artifact-sentence">
        <span>I want to make</span>
        <select
          className="artifact-select"
          value={artifactType}
          onChange={(e) => setArtifactType(e.target.value)}
          disabled={disabled || generating}
        >
          {options.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <span>.</span>
      </div>

      {isCustom && (
        <textarea
          className="artifact-custom-input"
          placeholder="Describe what you want to make from this transcript…"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          disabled={disabled || generating}
          rows={3}
        />
      )}

      <button
        className={buttonClassName}
        onClick={handleGenerate}
        disabled={!canGenerate}
        style={buttonStyle}
      >
        {generating && !isBlankNote ? <Loader2 className="spin" size={16} /> : <Icon size={16} />}
        {generating && !isBlankNote ? " Generating…" : ` ${label}`}
      </button>
    </div>
  );
}
