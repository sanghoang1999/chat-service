const Mess = require("../model/message");
exports.getMessage = async (from, to) => {
  const mess = Mess.find({
    $or: [
      {
        $and: [{ from: from }, { to: to }],
      },
      {
        $and: [{ from: to }, { to: from }],
      },
    ],
  });

  return mess;
};
