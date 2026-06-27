export const collectorRejectedTemplate = (name, reason) => ({
  subject: "Your Account Application — Future Bin",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #c62828;">Account Not Approved</h2>
      <p>Hi ${name},</p>
      <p>Unfortunately, your collector account application has not been approved.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>If you believe this is a mistake, please contact support.</p>
    </div>
  `,
});