import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: String,
      required: true,
      trim: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorProfileImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const threadSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: String,
      required: true,
      trim: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorProfileImage: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    replies: {
      type: [replySchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const Thread = mongoose.model("Thread", threadSchema);

export default Thread;
