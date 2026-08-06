import {
  registerUser,
  verifyEmailOtp,
  resendVerificationOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logoutUser,
} from "../services/userService.js";

const isProduction = () =>
  process.env.NODE_ENV === "production";

// Frontend (Vercel) and backend (AWS) are different sites, so the
// refresh cookie must be SameSite=None and Secure to be sent on the
// cross-site /auth/refresh request. Locally (localhost) Lax is enough.
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? "none" : "lax",
});

// Register
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      vehicleNumber,
    } = req.body;

    let vehiclePhoto = "";
    let idProof = "";

    if (req.files?.vehiclePhoto?.length) {
      vehiclePhoto = req.files.vehiclePhoto[0].path;
    }

    if (req.files?.idProof?.length) {
      idProof = req.files.idProof[0].path;
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (role === "collector") {
      if (
        !phone ||
        !vehicleNumber ||
        !vehiclePhoto ||
        !idProof
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Phone, vehicle number, vehicle image and ID proof are required for collectors",
        });
      }
    }

    const result = await registerUser({
      name,
      email,
      password,
      role,
      phone,
      vehicleNumber,
      vehiclePhoto,
      idProof,
    });

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const result = await verifyEmailOtp(email, otp);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Resend Verification OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await resendVerificationOtp(email);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginUser(email, password);

    res.cookie(
      "refreshToken",
      result.refreshToken,
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    const status =
      error.message ===
        "Your account is pending admin approval" ||
      error.message ===
        "Please verify your email before logging in"
        ? 403
        : 401;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// Forgot Password
export const forgotPasswordHandler = async (
  req,
  res
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await forgotPassword(email);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Reset Password
export const resetPasswordHandler = async (
  req,
  res
) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Email, OTP and new password are required",
      });
    }

    const result = await resetPassword(
      email,
      otp,
      newPassword
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Refresh Token
export const refresh = async (req, res) => {
  try {
    const incomingToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken;

    if (!incomingToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const result =
      await refreshAccessToken(incomingToken);

    res.cookie(
      "refreshToken",
      result.refreshToken,
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      success: true,
      accessToken: result.accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const incomingToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken;

    if (!incomingToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    await logoutUser(incomingToken);

    res.clearCookie(
      "refreshToken",
      getClearCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};