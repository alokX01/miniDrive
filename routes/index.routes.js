const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const upload = require("../config/multer.config");
const Firebase = require("../config/firebase.config");
const auth = require("../middleware/auth");
const FileModel = require("../models/file.model");

const router = express.Router();

router.get("/", (req, res) => {
  res.redirect("/user/login");
});

async function getOwnedFile(fileId, userId) {
  if (!mongoose.isValidObjectId(fileId)) return null;
  return FileModel.findOne({ _id: fileId, user: userId });
}

async function getFirebaseUploadById(firebaseId) {
  const snapshot = await Firebase.database().ref(`uploads/${firebaseId}`).once("value");
  if (!snapshot.exists()) return null;
  return snapshot.val();
}

function getSafeFileName(fileName) {
  return String(fileName || "file").replace(/"/g, "");
}

router.get("/home", auth, async (req, res) => {
  try {
    const files = await FileModel.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.render("home", {
      username: req.user?.username || "User",
      success: req.query.success || null,
      error: req.query.error || null,
      files,
    });
  } catch (err) {
    return res.status(500).render("home", {
      username: req.user?.username || "User",
      success: null,
      error: "Failed to load uploaded files",
      files: [],
    });
  }
});

router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .redirect("/home?error=" + encodeURIComponent("No file selected"));
    }

    const fileHash = crypto
      .createHash("sha256")
      .update(req.file.buffer)
      .digest("hex");

    const existingFile = await FileModel.findOne({
      user: req.user.userId,
      fileHash,
    });

    if (existingFile) {
      return res.redirect(
        "/home?success=" + encodeURIComponent("File already uploaded")
      );
    }

    const uploadRef = Firebase.database().ref("uploads").push();
    await uploadRef.set({
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileData: req.file.buffer.toString("base64"),
      createdAt: Date.now(),
      userId: req.user.userId,
      username: req.user.username,
      email: req.user.email,
    });

    await FileModel.create({
      user: req.user.userId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      firebaseId: uploadRef.key,
      fileHash,
    });

    return res.redirect(
      "/home?success=" + encodeURIComponent("File uploaded successfully")
    );
  } catch (err) {
    return res
      .status(500)
      .redirect("/home?error=" + encodeURIComponent("Failed to upload file"));
  }
});

router.get("/file/:id/view", auth, async (req, res) => {
  try {
    const file = await getOwnedFile(req.params.id, req.user.userId);
    if (!file) {
      return res
        .status(404)
        .redirect("/home?error=" + encodeURIComponent("File not found"));
    }

    const uploadData = await getFirebaseUploadById(file.firebaseId);
    if (!uploadData || !uploadData.fileData) {
      return res
        .status(404)
        .redirect("/home?error=" + encodeURIComponent("File data not found"));
    }

    const safeFileName = getSafeFileName(file.fileName);
    const buffer = Buffer.from(uploadData.fileData, "base64");

    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${safeFileName}"`
    );
    return res.send(buffer);
  } catch (err) {
    return res
      .status(500)
      .redirect("/home?error=" + encodeURIComponent("Unable to view file"));
  }
});

router.get("/file/:id/download", auth, async (req, res) => {
  try {
    const file = await getOwnedFile(req.params.id, req.user.userId);
    if (!file) {
      return res
        .status(404)
        .redirect("/home?error=" + encodeURIComponent("File not found"));
    }

    const uploadData = await getFirebaseUploadById(file.firebaseId);
    if (!uploadData || !uploadData.fileData) {
      return res
        .status(404)
        .redirect("/home?error=" + encodeURIComponent("File data not found"));
    }

    const safeFileName = getSafeFileName(file.fileName);
    const buffer = Buffer.from(uploadData.fileData, "base64");

    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName}"`
    );
    return res.send(buffer);
  } catch (err) {
    return res
      .status(500)
      .redirect("/home?error=" + encodeURIComponent("Unable to download file"));
  }
});

module.exports = router;
