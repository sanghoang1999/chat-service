const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Conneted...");
  } catch (error) {
    console.log(error);
  }
};
module.exports = connectDB;
