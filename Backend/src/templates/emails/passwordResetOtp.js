export const passwordResetOtpTemplate = (otp) => ({
  subject: "Password Reset OTP — Future Bin",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Future Bin</h2>
      <p>You requested a password reset. Use the OTP below to reset your password.</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2e7d32; margin: 24px 0;">
        ${otp}
      </div>
      <p>This OTP expires in <strong>10 minutes</strong>.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `,
});