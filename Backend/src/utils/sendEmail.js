import getTransporter from "../config/mailer.js";
import { verificationOtpTemplate } from "../templates/emails/verificationOtp.js";
import { welcomeEmailTemplate } from "../templates/emails/welcomeEmail.js";
import { collectorRegistrationTemplate } from "../templates/emails/collectorRegistration.js";
import { collectorApprovedTemplate } from "../templates/emails/collectorApproved.js";
import { collectorRejectedTemplate } from "../templates/emails/collectorRejected.js";
import { passwordResetOtpTemplate } from "../templates/emails/passwordResetOtp.js";
import { pickupOtpTemplate } from "../templates/emails/pickupOtp.js";
import { pickupCompletedResidentTemplate, pickupCompletedCollectorTemplate } from "../templates/emails/pickupCompleted.js";

// ─── Generic Send ─────────────────────────────────────────────────────────────

const sendMail = async ({ to, subject, html }) => {
  await getTransporter().sendMail({
    from: `"Future Bin" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// ─── Named Senders ────────────────────────────────────────────────────────────

export const sendVerificationOtp = async (email, otp) => {
  const { subject, html } = verificationOtpTemplate(otp);
  await sendMail({ to: email, subject, html });
};

export const sendWelcomeEmail = async (email, name) => {
  const { subject, html } = welcomeEmailTemplate(name);
  await sendMail({ to: email, subject, html });
};

export const sendCollectorRegistrationAlert = async (adminEmail, collectorName) => {
  const { subject, html } = collectorRegistrationTemplate(collectorName);
  await sendMail({ to: adminEmail, subject, html });
};

export const sendCollectorApprovedEmail = async (email, name) => {
  const { subject, html } = collectorApprovedTemplate(name);
  await sendMail({ to: email, subject, html });
};

export const sendCollectorRejectedEmail = async (email, name, reason) => {
  const { subject, html } = collectorRejectedTemplate(name, reason);
  await sendMail({ to: email, subject, html });
};

export const sendPasswordResetOtp = async (email, otp) => {
  const { subject, html } = passwordResetOtpTemplate(otp);
  await sendMail({ to: email, subject, html });
};

export const sendPickupOtp = async (email, otp, address) => {
  const { subject, html } = pickupOtpTemplate(otp, address);
  await sendMail({ to: email, subject, html });
};

export const sendPickupCompletedToResident = async (email, name, address, weight, amount, collectorName) => {
  const { subject, html } = pickupCompletedResidentTemplate(name, address, weight, amount, collectorName);
  await sendMail({ to: email, subject, html });
};

export const sendPickupCompletedToCollector = async (email, name, address, weight, amount, residentName) => {
  const { subject, html } = pickupCompletedCollectorTemplate(name, address, weight, amount, residentName);
  await sendMail({ to: email, subject, html });
};