export const verificationOtpTemplate = (otp) => ({
  subject: "Verify Your Email — Future Bin",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Future Bin</h2>
      <p>Thanks for signing up! Use the OTP below to verify your email address.</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2e7d32; margin: 24px 0;">
        ${otp}
      </div>
      <p>This OTP expires in <strong>10 minutes</strong>.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
    </div>
  `,
});