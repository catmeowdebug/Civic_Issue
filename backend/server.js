const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Ensure uploads folder exists
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("📂 Created uploads folder");
}

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsPath));

// ✅ MongoDB Connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
}

// ✅ Schemas & Models

const reportSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    deviceId: { type: String, required: true },
    caption: { type: String, required: true },
    imageUrl: { type: String, required: true },
    address: { type: String, default: "" },
    status: { type: String, default: "unresolved" },
    community: { type: Boolean, default: false },
    comments: [
      {
        deviceId: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    upvotes: [{ deviceId: String }],
  },
  { timestamps: true }
);

const communitySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    caption: { type: String, required: true },
    imageUrl: { type: String, required: true },
    address: { type: String, default: "" },
    upvotes: [{ deviceId: String }],
    comments: [
      {
        deviceId: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const CommunityPost = mongoose.model("CommunityPost", communitySchema);
const Report = mongoose.model("Report", reportSchema);

// ✅ Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsPath),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// ✅ Report routes
app.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error("GET /reports error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

app.post("/reports", upload.single("image"), async (req, res) => {
  try {
    const { caption, address = "", userId, deviceId, postToCommunity } = req.body;

    if (!userId || !deviceId || !req.file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const report = new Report({ caption, address, imageUrl, userId, deviceId, community: postToCommunity || false });
    await report.save();

    // If postToCommunity is true, create community post
    if (postToCommunity === "true" || postToCommunity === true) {
      const communityPost = new CommunityPost({ caption, address, imageUrl, userId });
      await communityPost.save();
    }

    res.status(201).json({ message: "Report created", report });
  } catch (err) {
    console.error("POST /reports error:", err);
    res.status(500).json({ error: "Failed to create report" });
  }
});

app.post("/reports/:id/comment", async (req, res) => {
  try {
    const { text, deviceId } = req.body;
    if (!text || !deviceId) return res.status(400).json({ error: "Missing fields" });

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    report.comments.push({ text, deviceId });
    await report.save();

    res.json({ message: "Comment added", comments: report.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.patch("/reports/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status required" });

    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!report) return res.status(404).json({ error: "Report not found" });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ✅ Community routes
app.get("/community", async (req, res) => {
  try {
    const posts = await CommunityPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch community posts" });
  }
});

app.post("/community", upload.single("image"), async (req, res) => {
  try {
    const { caption, address = "", userId } = req.body;
    if (!caption || !userId || !req.file) return res.status(400).json({ error: "Missing fields" });

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const post = new CommunityPost({ caption, address, imageUrl, userId });
    await post.save();

    res.status(201).json({ message: "Community post created", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create community post" });
  }
});

app.post("/community/:id/upvote", async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: "deviceId required" });

    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!post.upvotes.find(u => u.deviceId === deviceId)) {
      post.upvotes.push({ deviceId });
      await post.save();
    }

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upvote post" });
  }
});

app.post("/community/:id/comment", async (req, res) => {
  try {
    const { deviceId, text } = req.body;
    if (!deviceId || !text) return res.status(400).json({ error: "Missing fields" });

    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ deviceId, text });
    await post.save();

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ✅ Start Server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

startServer();
