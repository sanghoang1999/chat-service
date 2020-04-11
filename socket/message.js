const socket = require("socket.io");
var socketioJwt = require("socketio-jwt");
const Message = require("../model/message");
let sockets = {};

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

  io.on("connection", (socket) => {
    const { handle, imageUrl } = socket.decoded_token;
    socket.join(socket.decoded_token.handle);
    socket.id = socket.decoded_token.handle;
    socket.on("message", async (from, to) => {
      try {
        const Mess = new Message({
          read: false,
          from: from,
          to: to,
        });
        const resData = await Mess.save();

        console.log(resData);
        io.to(recipient).emit("recive_message", resData);
      } catch (err) {
        console.log(err);
      }
    });
  });
};
module.exports = sockets;
