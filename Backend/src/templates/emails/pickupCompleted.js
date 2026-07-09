export const pickupCompletedResidentTemplate = (name, address, weight, amount, collectorName) => ({
  subject: "Pickup Completed — Future Bin",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Future Bin</h2>
      <p>Hi ${name},</p>
      <p>Your waste pickup has been completed successfully.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #555;">Address</td><td style="padding: 8px; font-weight: bold;">${address}</td></tr>
        <tr><td style="padding: 8px; color: #555;">Weight</td><td style="padding: 8px; font-weight: bold;">${weight} kg</td></tr>
        <tr><td style="padding: 8px; color: #555;">Amount</td><td style="padding: 8px; font-weight: bold;">₹${amount}</td></tr>
        <tr><td style="padding: 8px; color: #555;">Collected by</td><td style="padding: 8px; font-weight: bold;">${collectorName}</td></tr>
      </table>
      <p style="color: #999; font-size: 12px;">Thank you for contributing to a cleaner environment!</p>
    </div>
  `,
});

export const pickupCompletedCollectorTemplate = (name, address, weight, amount, residentName) => ({
  subject: "Pickup Completed — Future Bin",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Future Bin</h2>
      <p>Hi ${name},</p>
      <p>You have successfully completed a pickup.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #555;">Address</td><td style="padding: 8px; font-weight: bold;">${address}</td></tr>
        <tr><td style="padding: 8px; color: #555;">Weight</td><td style="padding: 8px; font-weight: bold;">${weight} kg</td></tr>
        <tr><td style="padding: 8px; color: #555;">Amount</td><td style="padding: 8px; font-weight: bold;">₹${amount}</td></tr>
        <tr><td style="padding: 8px; color: #555;">Resident</td><td style="padding: 8px; font-weight: bold;">${residentName}</td></tr>
      </table>
      <p style="color: #999; font-size: 12px;">Keep up the great work!</p>
    </div>
  `,
});
