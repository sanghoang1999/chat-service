const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  handle: String,
  imageurl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: { type: String, default: "online" },
  lastTime: {
    type: Date,
    default: Date.now,
  },
  friends: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      priority: {
        type: Number,
        default: 0,
      },
    },
  ],
});
module.exports = mongoose.model("user", UserSchema);
