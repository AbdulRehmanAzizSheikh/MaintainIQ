import mongoose from "mongoose";
declare global {
  var mongoose:
    | {
        conn: any;
        promise: any;
      }
    | undefined;
}

let cached = global.mongoose;
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please provide a valid MongoDB URI");
}

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectMongodb = async () => {
  if (cached.conn) {
    console.log("Using cached connection");
    return cached.conn;
  }

  try {
    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI);
    }

    cached.conn = await cached.promise;
    console.log("Connected to MongoDB");
    return cached.conn;
  } catch (error) {
    console.log("Error connecting to MongoDB", error);
    throw error;
  }
};
