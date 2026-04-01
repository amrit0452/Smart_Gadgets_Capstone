const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const apiRoutes = require("./routes/index");
const { errorMiddleware } = require("./middlewares/errorMiddleware");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api", apiRoutes);

// Serve frontend static pages from /frontend
const staticRoot = path.join(__dirname, "..", "..", "frontend");
app.use(express.static(staticRoot));

app.get("/", (req, res) => {
  res.sendFile(path.join(staticRoot, "Home.html"));
});

// Central error handler
app.use(errorMiddleware);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Neo Gadgets backend listening on port ${PORT}`);
});

