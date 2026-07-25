export const subscriptionInsufficientBalanceTemplate = (name, frequency) => ({
  subject: "Wallet Balance Low — Future Bin",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #2e7d32;">Future Bin</h2>
      <p>Hi ${name},</p>
      <p>We were unable to create your scheduled <strong>${frequency}</strong> pickup because your wallet balance is insufficient.</p>
      <p>Please top up your wallet to ensure your upcoming pickups are processed automatically.</p>
      <p style="color: #999; font-size: 12px;">This is an automated message. Your subscription will retry on the next scheduled run.</p>
    </div>
  `,
});
