export const pickupOtpTemplate = (otp, address) => ({
  subject: "Pickup OTP — Future Bin",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Future Bin</h2>
      <p>Your collector has arrived and is ready to complete the pickup.</p>
      <p style="color: #555;">Please share the OTP below with your collector to confirm completion.</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2e7d32; margin: 24px 0; text-align: center;">
        ${otp}
      </div>
      <p style="color: #777; font-size: 14px;">Pickup address: ${address}</p>
      <p style="color: #999; font-size: 12px;">This OTP expires in <strong>10 minutes</strong>.</p>
    </div>
  `,
});
