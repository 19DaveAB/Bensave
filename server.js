const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from BenSave-2 folder
app.use(express.static(path.join(__dirname, "BenSave-2")));

// Fallback: send index.html for any route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "BenSave-2", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
