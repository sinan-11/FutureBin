import {
  getUserById,
  getAllUsers,
  approveCollector,
  updateAvailability,
  updateLocation,
} from "../services/userService.js";


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

export const approveCollectorHandler = async (req,res) => {
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

export const setAvailability = async (req,res) => {
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

export const setLocation = async (req,res) => {
  try {
    const { longitude, latitude } =req.body;

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Longitude and latitude are required",
      });
    }

    if (typeof longitude !== "number" || typeof latitude !== "number") {
      return res.status(400).json({
        success: false,
        message:
          "Longitude and latitude must be numbers",
      });
    }

    if (longitude < -180 ||longitude > 180 ||latitude < -90 ||latitude > 90) {
      return res.status(400).json({
        success: false,
        message:
          "Coordinates are out of valid range",
      });
    }

    const user = await updateLocation(
      req.user.id,
      longitude,
      latitude
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