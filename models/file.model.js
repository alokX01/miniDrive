const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    firebaseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fileHash: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

fileSchema.index({ user: 1, fileHash: 1 });

const FileModel = mongoose.model("file", fileSchema);

module.exports = FileModel;
