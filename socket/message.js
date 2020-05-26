const socket = require("socket.io");
var socketioJwt = require("socketio-jwt");
const Message = require("../model/message");
const User = require("../model/user");
const NodeRSA = require("node-rsa");
const AWS = require("../controller/aws-e3/e3-wrapper");
const RSA = require("../controller/cypher/rsa-wrapper");
const AES = require("../controller/cypher/aes-wrapper");
const CryptoJs = require("crypto-js");
const {
  createUser,
  getListFriends,
  addFriend,
} = require("../controller/userController");
const { getMessage } = require("../controller/messageControoler");
let sockets = {};
let listAesKeys = {};

function checkExist(lst, a, b) {
  let isExist = false;
  for (let key in lst) {
    if (key === a + b || key === b + a) {
      isExist = true;
    }
  }
  return isExist;
}
function removeKey(lst, a, b) {
  if (lst[a + b]) {
    delete lst[a + b];
  } else delete lst[b + a];
}
function getAesKey(lsb, a, b) {
  return lsb[a + b] ? lsb[a + b] : lsb[b + a];
}
function insertKey(lsb, a, b, rsa) {
  if (checkExist(a, b)) {
    return false;
  }
  lsb[a + b] = rsa;
  return true;
}
let listUserOnline = [];
sockets.init = function (server) {
  let io = socket
    .listen(server, { cookie: false, origins: "*:*" })
    .of("/socket/message");
  io.use(
    socketioJwt.authorize({
      secret: "emvuidi",
      handshake: true,
    })
  );

  io.on("connection", async (socket) => {
    socket.rsaKey = {};
    socket.aesKey = {};
    const { handle, imageurl } = socket.decoded_token;
    console.log("join " + handle);
    socket.join(socket.decoded_token.handle);
    socket.id = socket.decoded_token.handle;
    const setOnline = User.findOneAndUpdate(
      { handle: socket.id },
      { status: "online" }
    );
    await setOnline;

    const userId = await createUser(handle, imageurl);

    const friends = await getListFriends(handle);

    const listName = friends.friends.map((item) => item.user.handle);
    listUserOnline.unshift({ handle, imageurl, _id: userId._id });
    io.to(handle).emit("friends", friends);

    console.log("list user online");
    setTimeout(() => {
      io.emit("join", listUserOnline, socket.id);
    }, 500);

    socket.on("disconnect", async () => {
      console.log("leave " + socket.id);
      const index = listUserOnline.findIndex(
        (item) => item.handle === socket.id
      );
      if (index !== -1) {
        listUserOnline.splice(index, 1);
      }
      const user = await User.findOneAndUpdate(
        { handle: socket.id },
        {
          status: "offline",
        }
      );
      io.emit("leave", socket.id, listUserOnline);
    });
    socket.on("makeFriend", async (idTo) => {
      const friends = await addFriend(userId, idTo);
    });
    socket.on("get_connection", async (to, cb) => {
      console.log("cc");
      console.log(socket.aesKey);

      if (!checkExist(socket.rsaKey, socket.id, to)) {
        const pairKey = RSA.generateKey();
        insertKey(socket.rsaKey, socket.id, to, pairKey);

        cb(pairKey.publicKey, false);
      } else {
        cb(getAesKey(listAesKeys, socket.id, to), true);
      }
    });
    socket.on("send_aesKey", (rsaEncryptedAesKey, reciver, cb) => {
      try {
        let PrivateKey = new NodeRSA(
          getAesKey(socket.rsaKey, socket.id, reciver).privateKey
        );
        PrivateKey.setOptions({ encryptionScheme: "pkcs1" });
        const keyAES = PrivateKey.decrypt(rsaEncryptedAesKey, "utf8");

        if (!checkExist(reciver, socket.id)) {
          insertKey(listAesKeys, reciver, socket.id, JSON.parse(keyAES));
        }

        console.log(reciver, socket.id);
        if (reciver !== socket.id) {
          console.log(reciver);
          io.to(reciver).emit("recive_aseKey", socket.id, JSON.parse(keyAES));
        }
        cb();
      } catch (error) {
        console.log(error);
      }
    });
    socket.on("get_message", async (from, to, cb) => {
      const mess = await getMessage(from, to);
      cb(mess);
    });
    socket.on("sendImage", async (image, to, cb) => {
      // let data = AES.decrypt(image, getAesKey(listAesKeys, socket.id, to));
      var stored = await AWS.uploadImage(image);
      let plainMsg = {
        from: socket.id,
        to: to,
        message: stored.Location,
        type: "image",
      };

      cb(plainMsg);
      const newMess = Message(plainMsg);
      let messPromise = newMess.save();

      // let cypherMsg = AES.encrypt(
      //   JSON.stringify(plainMsg),
      //   getAesKey(listAesKeys, socket.id, to)
      // );

      const userPm = User.findOne({ handle: plainMsg.from }).select(
        "_id handle imageurl status "
      );
      await messPromise;
      const userSend = await userPm;
      if (socket.id !== to) {
        io.to(newMess.to).emit("serviceMessage", plainMsg, userSend);
      }
    });
    socket.on("sendmessage", async (message, to) => {
      // console.log(message);
      // console.log(socket.aesKey[to]);
      // let msgDecrypt = AES.decrypt(
      //   message,
      //   getAesKey(listAesKeys, socket.id, to),
      //   "Utf8"
      // );
      // console.log(message);
      // console.log(msgDecrypt);
      // plainMsg = JSON.parse(msgDecrypt);
      // console.log(plainMsg);
      const newMess = Message(message);
      const userPm = User.findOne({ handle: message.from }).select(
        "_id handle imageurl status "
      );
      await newMess.save();
      const userSend = await userPm;
      io.to(newMess.to).emit("serviceMessage", newMess, userSend);
    });

    socket.on("closeChat", async (idUserTo, to) => {
      //removeKey(socket.rsaKey, socket.id, to);
      let user = await User.findById({ _id: userId._id });
      console.log(socket.aesKey);
      console.log("close");
      user.friends.forEach((item) => {
        if (item.user.toString() === idUserTo.toString()) {
          item.priority++;
        }
      });
      await user.save();
    });
  });
};
module.exports = sockets;
