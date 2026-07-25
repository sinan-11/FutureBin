export const subscriptionCreatedTemplate = (name, frequency, wasteType, nextRunAt) => ({
  subject: "Subscription Created — Future Bin",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Future Bin</h2>
      <p>Hi ${name},</p>
      <p>Your <strong>${frequency}</strong> pickup subscription has been created successfully.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #555;">Frequency</td><td style="padding: 8px; font-weight: bold;">${frequency}</td></tr>
        <tr><td style="padding: 8px; color: #555;">Waste Type</td><td style="padding: 8px; font-weight: bold;">${wasteType}</td></tr>
        <tr><td style="padding: 8px; color: #555;">Next Pickup</td><td style="padding: 8px; font-weight: bold;">${nextRunAt}</td></tr>
      </table>
      <p style="color: #999; font-size: 12px;">You can manage your subscription from the app at any time.</p>
    </div>
  `,
});
