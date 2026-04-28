const { exec } = require("child_process");

const openFolderHandler = (req, res) => {
  const { folderPath } = req.body;
  let command = "";

  switch (process.platform) {
    case "darwin":
      command = `open "${folderPath}"`;
      break;
    case "win32":
      command = `explorer "${folderPath}"`;
      break;
    default:
      command = `xdg-open "${folderPath}"`;
      break;
  }

  exec(command, (err) => {
    if (err) return res.status(500).json({ error: "Could not open folder" });
    res.json({ success: true });
  });
};

module.exports = { openFolderHandler };
