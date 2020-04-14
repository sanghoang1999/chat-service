const User = require("../model/user");

exports.createUser = async (handle, imageurl) => {
  try {
    let user = await User.findOne({ handle: handle }).select("_id");
    if (!user) {
      user = new User({
        handle,
        imageurl,
      });
      return user.save();
    }
    return user;
  } catch (error) {
    console.log(error);
  }
};

exports.getListFriends = async (handle) => {
  try {
    const data = await User.findOne({ handle: handle })
      .populate("friends.user", [
        "_id",
        "handle",
        "imageurl",
        "lastTime",
        "status",
        "priority",
      ])
      .select("friends.user friends.priority  -_id");
    console.log(data);
    data.friends.sort((x, y) => y.priority - x.priority);
    return data;
  } catch (error) {
    console.log(error);
  }
};

exports.addFriend = async (idFrom, idTo) => {
  console.log(idFrom, idTo);
  try {
    const user = await User.findById(idFrom);
    if (
      user.friends.filter((item) => item.user.toString() === idTo).length == 0
    ) {
      const friendData = {
        priority: 0,
        user: idTo,
      };
      user.friends.unshift(friendData);
      return user.save();
    }
    return user;
  } catch (error) {
    console.log(error);
  }
};
