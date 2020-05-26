const mongoose = require("mongoose");

const MessageScream = new mongoose.Schema({
  read: Boolean,
  to: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  from: String,
  message: String,
  type: {
    type: String,
    default: "text",
  },
});

module.exports = mongoose.model("message", MessageScream);
