import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  creatorId: mongoose.Types.ObjectId;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar?: string;
  caption: string;
  mediaUrl: string;
  taggedProductId?: mongoose.Types.ObjectId;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorName: {
      type: String,
      required: true,
      trim: true,
    },
    creatorUsername: {
      type: String,
      default: "",
      trim: true,
    },
    creatorAvatar: {
      type: String,
      default: "",
    },
    caption: {
      type: String,
      required: true,
      trim: true,
    },
    mediaUrl: {
      type: String,
      required: true,
      trim: true,
    },
    taggedProductId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ creatorId: 1, createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 });

const Post = (mongoose.models.Post as mongoose.Model<IPost>) || mongoose.model<IPost>("Post", PostSchema);
export default Post;
