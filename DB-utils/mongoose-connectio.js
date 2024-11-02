import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const host = "localhost:27017";

const cloudUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const connectViaMongoose = async () => {
  try {
    await mongoose.connect(cloudUrl);
    console.log("connect to DB via mongoose");
  } catch (e) {
    console.error("Error in connecting to Db", e);
    process.exit(1);
  }
};

export default connectViaMongoose;
