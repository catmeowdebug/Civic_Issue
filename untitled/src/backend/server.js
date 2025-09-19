// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Atlas Connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

/**
 * Reports Schema
 */
const reportSchema = new mongoose.Schema(
    {
        userId: String,
        deviceId: String,
        caption: String,
        imageUrl: String,
        address: String,
        status: { type: String, default: "unresolved" }, // unresolved | resolved | assigned
        assignedDepartment: { type: String, default: "" }, // NEW FIELD
        latitude: Number,
        longitude: Number,
        community: { type: Boolean, default: false },
        comments: { type: [String], default: [] },
        upvotes: { type: [String], default: [] },
    },
    { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);

/**
 * CommunityPosts Schema
 */
const communityPostSchema = new mongoose.Schema(
    {
        userId: String,
        caption: String,
        imageUrl: String,
        address: String,
        upvotes: { type: [String], default: [] },
        comments: { type: [String], default: [] },
    },
    { timestamps: true }
);

const CommunityPost = mongoose.model(
    "CommunityPost",
    communityPostSchema,
    "communityposts"
);

/**
 * Helper: Geocode address
 */
async function getCoordinates(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
    )}`;
    try {
        const res = await axios.get(url);
        if (res.data.length > 0) {
            return {
                latitude: parseFloat(res.data[0].lat),
                longitude: parseFloat(res.data[0].lon),
            };
        }
        return null;
    } catch (err) {
        console.error("Geocoding error:", err);
        return null;
    }
}

/**
 * Routes
 */
// Root check
app.get("/", (req, res) => {
    res.json({ message: "✅ Backend is working!" });
});

/* ===========================
   📌 REPORTS API
   =========================== */

// Fetch all reports
app.get("/reports", async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});

// Create a new report
app.post("/reports", async (req, res) => {
    try {
        let { caption, userId, deviceId, address, status, imageUrl } = req.body;

        if (!imageUrl && req.file) {
            imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        let latitude = null;
        let longitude = null;
        if (address) {
            const coords = await getCoordinates(address);
            if (coords) {
                latitude = coords.latitude;
                longitude = coords.longitude;
            }
        }

        const report = new Report({
            caption,
            userId,
            deviceId,
            address,
            status: status || "unresolved",
            imageUrl,
            latitude,
            longitude,
        });

        await report.save();
        res.status(201).json(report);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Failed to create report" });
    }
});

// Update a report
app.put("/reports/:id", async (req, res) => {
    try {
        const updatedReport = await Report.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedReport);
    } catch (err) {
        res.status(400).json({ error: "Failed to update report" });
    }
});

// Delete a report
app.delete("/reports/:id", async (req, res) => {
    try {
        await Report.findByIdAndDelete(req.params.id);
        res.json({ message: "Report deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete report" });
    }
});

// Mark a report as resolved
app.put("/reports/:id/resolve", async (req, res) => {
    try {
        const updatedReport = await Report.findByIdAndUpdate(
            req.params.id,
            { status: "resolved" },
            { new: true }
        );
        res.json(updatedReport);
    } catch (err) {
        res.status(400).json({ error: "Failed to resolve report" });
    }
});

// Assign a report to a department (NEW ROUTE)
app.put("/reports/:id/assign", async (req, res) => {
    try {
        const { department } = req.body;
        const updatedReport = await Report.findByIdAndUpdate(
            req.params.id,
            { status: "assigned", assignedDepartment: department },
            { new: true }
        );
        res.json(updatedReport);
    } catch (err) {
        res.status(400).json({ error: "Failed to assign report" });
    }
});

/* ===========================
   📌 COMMUNITY POSTS API
   =========================== */

// Fetch all community posts
app.get("/community", async (req, res) => {
    try {
        const posts = await CommunityPost.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch community posts" });
    }
});

// Create a new community post
app.post("/community", async (req, res) => {
    try {
        const { userId, caption, imageUrl, address } = req.body;

        const post = new CommunityPost({
            userId,
            caption,
            imageUrl,
            address,
        });

        await post.save();
        res.status(201).json(post);
    } catch (err) {
        res.status(400).json({ error: "Failed to create community post" });
    }
});

// Delete a community post
app.delete("/community/:id", async (req, res) => {
    try {
        await CommunityPost.findByIdAndDelete(req.params.id);
        res.json({ message: "Community post deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete community post" });
    }
});

// Upvote a post
app.put("/community/:id/upvote", async (req, res) => {
    try {
        const { userId } = req.body;
        const post = await CommunityPost.findById(req.params.id);

        if (!post) return res.status(404).json({ error: "Post not found" });

        if (!post.upvotes.includes(userId)) {
            post.upvotes.push(userId);
        }

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(400).json({ error: "Failed to upvote post" });
    }
});

// Comment on a post
app.post("/community/:id/comment", async (req, res) => {
    try {
        const { comment } = req.body;
        const post = await CommunityPost.findById(req.params.id);

        if (!post) return res.status(404).json({ error: "Post not found" });

        post.comments.push(comment);
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(400).json({ error: "Failed to add comment" });
    }
});

/**
 * Start Server
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
);
