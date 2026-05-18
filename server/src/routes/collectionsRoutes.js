const express = require("express");
const router = express.Router();
const {
  listCollectionsHandler,
  createCollectionHandler,
  deleteCollectionHandler,
  renameCollectionHandler,
} = require("../controllers/collectionsController");

router.get("/", listCollectionsHandler);
router.post("/", createCollectionHandler);
router.patch("/:id", renameCollectionHandler);
router.delete("/:id", deleteCollectionHandler);

module.exports = router;
