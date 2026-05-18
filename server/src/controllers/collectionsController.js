const {
  listCollections,
  createCollection,
  deleteCollection,
  renameCollection,
} = require("../repositories/videoRepository");

const listCollectionsHandler = (req, res) => {
  res.json(listCollections());
};

const createCollectionHandler = (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Title is required" });
  const collection = createCollection(title.trim());
  res.status(201).json(collection);
};

const deleteCollectionHandler = (req, res) => {
  const { id } = req.params;
  const deleted = deleteCollection(id);
  if (!deleted) return res.status(404).json({ error: "Collection not found" });
  res.json({ success: true });
};

const renameCollectionHandler = (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Title is required" });
  const result = renameCollection(id, title.trim());
  if (!result) return res.status(404).json({ error: "Collection not found" });
  res.json(result);
};

module.exports = {
  listCollectionsHandler,
  createCollectionHandler,
  deleteCollectionHandler,
  renameCollectionHandler,
};
