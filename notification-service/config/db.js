import mongoose from "mongoose";

const connectDB = async () => {
  // Skip DB connection during tests to avoid hard exits when MONGO_URI is not configured
  if (process.env.NODE_ENV === "test") return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB Connection Failed:", err);
    process.exit(1);
  }
};

export default connectDB;
