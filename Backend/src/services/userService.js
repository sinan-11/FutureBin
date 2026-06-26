import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";


export const registerUser = async (data) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    vehicleNumber,
    idProof,
    vehiclePhoto,
  } = data;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const allowedRoles = [
    "resident",
    "collector",
  ];

  if (role && !allowedRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  if (role === "collector") {
    if (!phone || !vehicleNumber) {
      throw new Error(
        "Phone and vehicle number are required for collectors"
      );
    }
  }

  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,

    collectorDetails:
      role === "collector"
        ? {
            phone,
            vehicleNumber,
            idProof,
            vehiclePhoto,
          }
        : undefined,
  });

  const userResponse = user.toObject();

  delete userResponse.password;
  delete userResponse.refreshToken;

  // Collectors must wait for approval
  if (user.role === "collector") {
    return {
      user: userResponse,
      message:
        "Registration successful. Await admin approval.",
    };
  }

  const accessToken =
    generateAccessToken(user);

  const refreshToken =
    generateRefreshToken(user);

  user.refreshToken = refreshToken;

  await user.save();

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
};

// Login User
export const loginUser = async (
  email,
  password
) => {
  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new Error(
      "Invalid email or password"
    );
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    throw new Error(
      "Invalid email or password"
    );
  }

  if (
    user.role === "collector" &&
    !user.isApproved
  ) {
    throw new Error(
      "Your account is pending admin approval"
    );
  }

  const accessToken =
    generateAccessToken(user);

  const refreshToken =
    generateRefreshToken(user);

  user.refreshToken = refreshToken;

  await user.save();

  const userResponse = user.toObject();

  delete userResponse.password;
  delete userResponse.refreshToken;

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
};

// Refresh Access Token
export const refreshAccessToken =
  async (incomingToken) => {
    if (!incomingToken) {
      throw new Error(
        "No refresh token provided"
      );
    }

    let decoded;

    try {
      decoded = jwt.verify(
        incomingToken,
        process.env.JWT_REFRESH_SECRET
      );
    } catch (error) {
      throw new Error(
        "Invalid or expired refresh token"
      );
    }

    const user =
      await User.findById(
        decoded.id
      ).select("+refreshToken");

    if (
      !user ||
      user.refreshToken !== incomingToken
    ) {
      throw new Error(
        "Please login again"
      );
    }

    const accessToken =
      generateAccessToken(user);

    const refreshToken =
      generateRefreshToken(user);

    user.refreshToken = refreshToken;

    await user.save();

    return {
      accessToken,
      refreshToken,
    };
  };

// Logout User
export const logoutUser = async (
  incomingToken
) => {
  if (!incomingToken) return;

  let decoded;

  try {
    decoded = jwt.verify(
      incomingToken,
      process.env.JWT_REFRESH_SECRET
    );
  } catch {
    return;
  }

  const user =
    await User.findById(
      decoded.id
    ).select("+refreshToken");

  if (
    user &&
    user.refreshToken === incomingToken
  ) {
    user.refreshToken = null;

    await user.save();
  }
};

// Get User By Id
export const getUserById = async (
  id
) => {
  const user = await User.findById(
    id
  ).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// Get All Users
export const getAllUsers =
  async () => {
    return await User.find().select(
      "-password"
    );
  };

// Approve Collector
export const approveCollector =
  async (id) => {
    const user =
      await User.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "collector") {
      throw new Error(
        "Only collector accounts can be approved"
      );
    }

    if (user.isApproved) {
      throw new Error(
        "Collector is already approved"
      );
    }

    user.isApproved = true;

    await user.save();

    return user;
  };

// Update Availability
export const updateAvailability =
  async (id, status) => {
    const user =
      await User.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "collector") {
      throw new Error(
        "Only collectors can update availability"
      );
    }

    user.isAvailable = status;

    await user.save();

    return user;
  };


export const updateLocation =
  async (
    id,
    longitude,
    latitude
  ) => {
    const user =
      await User.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "collector") {
      throw new Error(
        "Only collectors can update location"
      );
    }

    user.location = {
      type: "Point",
      coordinates: [
        longitude,
        latitude,
      ],
    };

    await user.save();

    return user;
  };