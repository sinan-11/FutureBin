import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

import AuthLayout from "../../components/AuthLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";

import { resetPasswordService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: searchParams.get("email") || "",
    otp: searchParams.get("otp") || "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await resetPasswordService(formData);
      toast.success(response.message || "Password reset successful");
      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new password" backTo={ROUTES.LOGIN}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
        <Input label="OTP" type="text" name="otp" value={formData.otp} onChange={handleChange} placeholder="Enter 6-digit OTP" required />
        <Input label="New Password" type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="Enter new password" required />
        <Button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
        <p className="text-center text-sm text-surface-600">
          <Link to={ROUTES.FORGOT_PASSWORD} className="font-semibold text-brand-600 hover:text-brand-700">
            Request a new OTP
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
