import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AuthLayout from "../../components/AuthLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";

import { forgotPasswordService, resetPasswordService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await forgotPasswordService({ email });
      toast.success(response.message);
      setStep(2);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await resetPasswordService({ email, otp, newPassword });
      toast.success(response.message || "Password reset successful");
      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle={step === 1 ? "Enter your email to receive an OTP" : "Enter the OTP and your new password"}>
      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Input label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
          <Button type="submit" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
          <p className="text-center text-sm text-surface-600">
            Remember your password?{" "}
            <Link to={ROUTES.LOGIN} className="font-semibold text-brand-600 hover:text-brand-700">
              Login
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input label="OTP" type="text" name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" required />
          <Input label="New Password" type="password" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" required />
          <Button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
          <p className="text-center text-sm text-surface-600">
            <button type="button" onClick={() => setStep(1)} className="font-semibold text-brand-600 hover:text-brand-700">
              Change email
            </button>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
