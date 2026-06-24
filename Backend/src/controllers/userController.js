import {
  getUserById,
  getAllUsers,
  approveCollector,
  updateAvailability,
  updateLocation,
} from "../services/userService.js";

// Get Current User
export const getMe = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Get User By Id (Admin)
export const getUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Users (Admin)
export const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve Collector (Admin)
export const approveCollectorHandler = async (
  req,
  res
) => {
  try {
    const user = await approveCollector(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Collector Availability
export const setAvailability = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({
        success: false,
        message:
          "Status must be true or false",
      });
    }

    const user =
      await updateAvailability(
        req.user.id,
        status
      );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Collector Location
export const setLocation = async (
  req,
  res
) => {
  try {
    const { longitude, latitude } =
      req.body;

    if (
      longitude === undefined ||
      latitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Longitude and latitude are required",
      });
    }

    const lng = Number(longitude);
    const lat = Number(latitude);

    if (
      isNaN(lng) ||
      isNaN(lat)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Longitude and latitude must be valid numbers",
      });
    }

    if (
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Coordinates are out of valid range",
      });
    }

    const user =
      await updateLocation(
        req.user.id,
        lng,
        lat
      );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};