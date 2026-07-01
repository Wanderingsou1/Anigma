import mongoose from "mongoose";

async function dbConnect(): Promise<typeof mongoose> {
  return mongoose;
}

export default dbConnect;
