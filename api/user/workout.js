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
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    const decode = verifyToken(req);
    const userId = decode.id;

    if (req.method === 'GET') {
      let date = req.query.date ? new Date(req.query.date) : new Date();

      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      const endOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      const todaysWorkouts = await Workout.find({
        user: userId,
        date: { $gte: startOfDay, $lt: endOfDay },
      });

      const totalCaloriesBurnt = todaysWorkouts.reduce(
        (total, workout) => total + workout.caloriesBurned,
        0
      );

      res.status(200).json({ todaysWorkouts, totalCaloriesBurnt });
    } else if (req.method === 'POST') {
      const { workoutString } = req.body;

      if (!workoutString) {
        return res.status(400).json({ message: "Workout string is missing" });
      }

      const workout = await Workout.create({
        user: userId,
        workoutName: workoutString,
        caloriesBurned: 100,
        date: new Date(),
      });

      res.status(201).json({
        message: "Workout added successfully",
        workout,
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}