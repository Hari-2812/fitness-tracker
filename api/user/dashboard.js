import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    img: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
    },
  },
  { timestamps: true }
);

const WorkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    workoutName: {
      type: String,
      required: true,
      unique: true,
    },
    sets: {
      type: Number,
    },
    reps: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    caloriesBurned: {
      type: Number,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
const Workout = mongoose.model("Workout", WorkoutSchema);

const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("You are not authenticated!");
  }
  const token = authHeader.split(" ")[1];
  if (!token) throw new Error("You are not authenticated");
  const decode = jwt.verify(token, process.env.JWT_SECRET);
  return decode;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL);

    const decode = verifyToken(req);
    const userId = decode.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const workouts = await Workout.find({ user: userId });

    const totalCaloriesBurnt = workouts.reduce(
      (sum, workout) => sum + workout.caloriesBurned,
      0
    );

    res.status(200).json({
      totalWorkouts: workouts.length,
      totalCaloriesBurnt,
      workouts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}