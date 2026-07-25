export const subscriptionPickupSkippedTemplate = (name, frequency) => ({
  subject: "Pickup Skipped — Future Bin",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Future Bin</h2>
      <p>Hi ${name},</p>
      <p>Your scheduled <strong>${frequency}</strong> pickup could not be created because a previous pickup from this subscription hasn't been completed yet.</p>
      <p>The next pickup will be generated automatically once the current one is completed.</p>
      <p style="color: #999; font-size: 12px;">This is an automated message.</p>
    </div>
  `,
});
