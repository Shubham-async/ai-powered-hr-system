import mongoose from "mongoose";

const platformKeySchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      required: true,
      unique: true
    },
    apiUrl: {
      type: String,
      required: true
    },
    apiKey: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("PlatformKey", platformKeySchema);
