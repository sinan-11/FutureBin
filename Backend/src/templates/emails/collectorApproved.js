export const collectorApprovedTemplate = (name) => ({
  subject: "Your Account Has Been Approved — Future Bin",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Congratulations, ${name}!</h2>
      <p>Your collector account has been approved by the admin.</p>
      <p>You can now log in to Future Bin and start accepting collection requests.</p>
    </div>
  `,
});