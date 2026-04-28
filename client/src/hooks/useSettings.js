import { useState, useEffect } from "react";
import {
  getSettings,
  saveSettings as saveSettingsApi,
  getEncoderPresets,
} from "../services/settingsService";

const DEFAULT_SETTINGS = {
  apiKey: "",
  model: "gpt-4o-mini",
  prompt: "",
  encoder: "videotoolbox",
};

const DEFAULT_ENCODER_PRESETS = [
  { key: "videotoolbox", label: "Apple VideoToolbox (macOS)" },
  { key: "qsv", label: "Intel Quick Sync (QSV)" },
  { key: "nvenc", label: "NVIDIA NVENC" },
  { key: "software", label: "Software (libx265)" },
];

export default function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [encoderPresets, setEncoderPresets] = useState(DEFAULT_ENCODER_PRESETS);

  const fetchSettings = async () => {
    try {
      const resp = await getSettings();
      setSettings((prev) => ({ ...prev, ...resp.data }));
    } catch (err) {
      console.error("Failed to fetch settings");
    }
  };

  useEffect(() => {
    fetchSettings();
    getEncoderPresets()
      .then((r) => {
        if (Array.isArray(r.data)) setEncoderPresets(r.data);
      })
      .catch(() => {});
  }, []);

  const saveSettings = async () => {
    try {
      await saveSettingsApi(settings);
      return true;
    } catch (err) {
      alert("Failed to save settings");
      return false;
    }
  };

  return {
    settings,
    setSettings,
    encoderPresets,
    saveSettings,
  };
}
