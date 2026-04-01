const express = require("express");
const cors = require("cors");
const fs = require("fs");
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

/** Linux is case-sensitive: repo may have product.html while links use Product.html. */
function resolveProductHtmlFile() {
  for (const name of ["Product.html", "product.html"]) {
    const full = path.join(staticRoot, name);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

app.get(/^\/product\.html$/i, (req, res, next) => {
  const file = resolveProductHtmlFile();
  if (!file) return next();
  return res.sendFile(path.resolve(file));
});

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

