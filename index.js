require("dotenv").config();
const express = require("express");
const cors = require("cors");
const messageSocket = require("./socket/message");
const app = express();
app.use(cors());
const connectDB = require("./config/mongoDB");

connectDB();
global.rsaKey = {};
global.aesKey = {};
app.use(express.json());

const PORT = process.env.PORT || 4600;
const server = app.listen(PORT, () => {
  console.log("emvuidi");
});
messageSocket.init(server);
