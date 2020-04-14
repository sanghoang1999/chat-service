const socket = require("socket.io");
var socketioJwt = require("socketio-jwt");
const Message = require("../model/message");
const User = require("../model/user");
const {
  createUser,
  getListFriends,
  addFriend,
} = require("../controller/userController");
const { getMessage } = require("../controller/messageControoler");
let sockets = {};
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
    // gui list ban be cua nguoi dung
    io.to(handle).emit("friends", friends);

    // neu nguoi dung moi online co ban be thi gui thong bao toi ban be cua ban
    // if (
    //   friends.friends.findIndex(
    //     (item) => item.user._id.toString() === userId._id.toString()
    //   ) !== -1
    // ) {
    //   console.log("friends");
    //   listName.map((user) => {
    //     io.to(user).emit("friend_join", userId._id);
    //   });
    // }

    // const listGuestOfUser = listUserOnline.filter(
    //   (item) =>
    //     friends.friends.findIndex((f) => f.user.handle === item.handle) === -1
    // );
    console.log("list user online");
    console.log(listUserOnline);
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
    socket.on("get_message", async (from, to, cb) => {
      const mess = await getMessage(from, to);
      console.log(mess);
      cb(mess);
      //io.to(socket.id).emit("list_mess", mess, to, list);
    });
    socket.on("sendmessage", async (message, listUserChat) => {
      const newMess = Message(message);
      await newMess.save();
      console.log(newMess);
      io.to(newMess.to).emit("serviceMessage", newMess, listUserChat);
    });
    socket.on("closeChat", async (idUserTo) => {
      let user = await User.findById({ _id: userId._id });
      console.log("close");
      console.log(user);
      user.friends.forEach((item) => {
        if (item.user.toString() === idUserTo.toString()) {
          item.priority++;
        }
      });
      console.log(user);
      await user.save();
    });
  });
};
module.exports = sockets;
