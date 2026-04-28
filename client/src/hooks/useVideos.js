import { useState, useEffect } from "react";
import {
  getVideos,
  uploadVideos,
  deleteVideoById,
  renameVideo,
  reorderVideos,
  openFolderPath,
} from "../services/videoService";

const POLL_INTERVAL_MS = 3000;

export default function useVideos() {
  const [videos, setVideos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchVideos = async () => {
    try {
      const resp = await getVideos();
      setVideos(resp.data);
    } catch (err) {
      console.error("Failed to fetch videos", err);
    }
  };

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("videos", files[i]);
    }

    try {
      await uploadVideos(formData);
      fetchVideos();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteVideo = async (id) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    try {
      await deleteVideoById(id);
      if (selectedId === id) setSelectedId(null);
      fetchVideos();
    } catch (err) {
      alert("Failed to delete video");
    }
  };

  const moveVideo = async (index, direction) => {
    const newVideos = [...videos];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newVideos.length) return;

    [newVideos[index], newVideos[targetIndex]] = [
      newVideos[targetIndex],
      newVideos[index],
    ];
    setVideos(newVideos);

    try {
      await reorderVideos(newVideos.map((v) => v.id));
    } catch (err) {
      console.error("Failed to save order", err);
      fetchVideos();
    }
  };

  const saveRename = async (id, newName) => {
    try {
      await renameVideo(id, newName);
      fetchVideos();
    } catch (err) {
      alert("Failed to rename video");
    }
  };

  const openFolder = async (folderPath) => {
    try {
      await openFolderPath(folderPath);
    } catch (err) {
      console.error("Failed to open folder");
    }
  };

  return {
    videos,
    setVideos,
    selectedId,
    setSelectedId,
    uploading,
    handleUpload,
    deleteVideo,
    moveVideo,
    saveRename,
    openFolder,
    fetchVideos,
  };
}
