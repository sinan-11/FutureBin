export const welcomeEmailTemplate = (name) => ({
  subject: "Welcome to Future Bin!",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Welcome, ${name}!</h2>
      <p>Your email has been verified. You can now log in and start using Future Bin.</p>
      <p>Thank you for joining us.</p>
    </div>
  `,
});