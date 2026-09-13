import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: "creator" | "brand" | "consumer" | "admin";
  profilePic?: string;
  status: "active" | "suspended";
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    passwordHash: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ["creator", "brand", "consumer", "admin"], 
      default: "consumer" 
    },
    profilePic: { 
      type: String, 
      default: "" 
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    }
  },
  { 
    timestamps: true 
  }
);

// Pre-save hook to hash the password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
export default User;
