import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    avatarUrl: {
      type: String,
      default:
        "https://api.dicebear.com/9.x/pixel-art/svg?seed=John&hair=short01,short02,short03,short04,short05",
    },
    bio: {
      type: String,
      default: "Yeh user apne baare mein thoda raaz rakhna pasand karta hai.",
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);


const User = mongoose.model("User", UserSchema);

export default User;
