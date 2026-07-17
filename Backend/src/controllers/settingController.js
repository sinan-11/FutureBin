import {
  getSettings,
  updateSetting,
  updateSettings,
} from "../services/settingService.js";

export const getAllSettings = async (req, res) => {
  try {
    const settings = await getSettings();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSingleSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: "Value is required",
      });
    }

    const numValue = Number(value);

    if (isNaN(numValue) || numValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Value must be a non-negative number",
      });
    }

    const setting = await updateSetting(key, numValue);

    res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      data: setting,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({
        success: false,
        message: "Settings object is required",
      });
    }

    const validated = {};

    for (const [key, value] of Object.entries(settings)) {
      const numValue = Number(value);

      if (isNaN(numValue) || numValue < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid value for "${key}". Must be a non-negative number.`,
        });
      }

      validated[key] = numValue;
    }

    const results = await updateSettings(validated);

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: results,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
