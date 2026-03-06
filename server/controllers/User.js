import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createError } from "../error.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";

dotenv.config();

export const UserRegister = async (req, res, next) => {
  try {
    const { email, password, name, img } = req.body || {};

    if (!email || !password || !name) {
      return next(createError(400, "Please provide all required fields"));
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(createError(409, "Email is already in use."));
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      img,
    });

    const createdUser = await user.save();

    const token = jwt.sign(
      { id: createdUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "9999 years" }
    );

    res.status(200).json({ token, user: createdUser });
  } catch (error) {
    next(error);
  }
};

export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return next(createError(400, "Email and password required"));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(createError(404, "User not found"));
    }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);

    if (!isPasswordCorrect) {
      return next(createError(403, "Incorrect password"));
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "9999 years" }
    );

    res.status(200).json({ token, user });
  } catch (error) {
    next(error);
  }
};

export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId);

    if (!user) {
      return next(createError(404, "User not found"));
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
  } catch (err) {
    next(err);
  }
};

export const getWorkoutsByDate = async (req, res, next) => {
  try {
    const userId = req.user?.id;

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
  } catch (err) {
    next(err);
  }
};

export const addWorkout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { workoutString } = req.body;

    if (!workoutString) {
      return next(createError(400, "Workout string is missing"));
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
  } catch (err) {
    next(err);
  }
};