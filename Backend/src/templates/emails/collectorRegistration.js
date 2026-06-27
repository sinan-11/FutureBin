export const collectorRegistrationTemplate = (collectorName) => ({
  subject: "New Collector Registration — Action Required",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Future Bin — Admin Alert</h2>
      <p>A new collector has registered and is awaiting your approval.</p>
      <p><strong>Name:</strong> ${collectorName}</p>
      <p>Please log in to the admin panel to review and approve or reject this account.</p>
    </div>
  `,
});