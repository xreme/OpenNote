import { useState, useEffect, useCallback } from "react";
import {
  getCollections,
  createCollection as createCollectionApi,
  renameCollection as renameCollectionApi,
  deleteCollection as deleteCollectionApi,
} from "../services/collectionsService";

const STORAGE_KEY = "activeCollection";

export default function useCollections() {
  const [collections, setCollections] = useState([]);
  const [activeCollectionId, setActiveCollectionIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null,
  );

  const setActiveCollection = useCallback((id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveCollectionIdState(id);
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const resp = await getCollections();
      const cols = resp.data;
      setCollections(cols);

      const stored = localStorage.getItem(STORAGE_KEY);
      const stillExists = cols.find((c) => c.id === stored);
      if (!stillExists && cols.length > 0) {
        const best = [...cols].sort(
          (a, b) => b.videoCount - a.videoCount || new Date(b.modifiedAt) - new Date(a.modifiedAt)
        )[0];
        setActiveCollection(best.id);
      }
    } catch (err) {
      console.error("Failed to fetch collections", err);
    }
  }, [setActiveCollection]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = async (title) => {
    const resp = await createCollectionApi(title);
    await fetchCollections();
    setActiveCollection(resp.data.id);
    return resp.data;
  };

  const renameCollection = async (id, newTitle) => {
    const resp = await renameCollectionApi(id, newTitle);
    const newId = resp.data.id;
    if (activeCollectionId === id) setActiveCollection(newId);
    await fetchCollections();
    return resp.data;
  };

  const deleteCollection = async (id) => {
    await deleteCollectionApi(id);
    await fetchCollections();
  };

  return {
    collections,
    activeCollectionId,
    setActiveCollection,
    createCollection,
    renameCollection,
    deleteCollection,
    fetchCollections,
  };
}
