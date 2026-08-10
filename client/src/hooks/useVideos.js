import { useState, useEffect, useCallback, useRef } from "react";
import {
  getVideos,
  uploadVideos,
  uploadVideoFromUrl,
  deleteVideoById,
  renameVideo,
  reorderVideos,
  openFolderPath,
} from "../services/videoService";

const POLL_INTERVAL_MS = 3000;

export default function useVideos(collectionId) {
  const [videos, setVideos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  // A reorder is optimistic; ignore poll results until the server has our order,
  // otherwise the 3s refresh snaps the list back to the pre-drag positions.
  const reorderPending = useRef(false);

  const fetchVideos = useCallback(async () => {
    if (!collectionId) return;
    try {
      const resp = await getVideos(collectionId);
      if (reorderPending.current) return;
      setVideos(resp.data);
    } catch (err) {
      console.error("Failed to fetch videos", err);
    }
  }, [collectionId]);

  useEffect(() => {
    setVideos([]);
    setSelectedId(null);
    fetchVideos();
    const interval = setInterval(fetchVideos, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchVideos]);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length || !collectionId) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("videos", files[i]);
    }
    formData.append("collectionId", collectionId);

    try {
      await uploadVideos(formData);
      fetchVideos();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlUpload = async (url) => {
    if (!url || !collectionId) return;
    setUploading(true);
    try {
      await uploadVideoFromUrl(url, collectionId);
      fetchVideos();
    } catch (err) {
      alert("Failed to add video from URL");
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

  const persistOrder = async (ordered) => {
    setVideos(ordered);
    reorderPending.current = true;
    try {
      await reorderVideos(ordered.map((v) => v.id), collectionId);
    } catch (err) {
      console.error("Failed to save order", err);
      reorderPending.current = false;
      fetchVideos();
      return;
    }
    reorderPending.current = false;
  };

  // Drop the dragged source into the slot the pointer is over, shifting the rest.
  const reorderVideo = async (dragId, dropId) => {
    if (!dragId || dragId === dropId) return;
    const ordered = [...videos];
    const from = ordered.findIndex((v) => v.id === dragId);
    const to = ordered.findIndex((v) => v.id === dropId);
    if (from < 0 || to < 0) return;

    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    await persistOrder(ordered);
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
    handleUrlUpload,
    deleteVideo,
    reorderVideo,
    saveRename,
    openFolder,
    fetchVideos,
  };
}
