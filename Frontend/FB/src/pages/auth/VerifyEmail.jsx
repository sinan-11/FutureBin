import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

import AuthLayout from "../../components/AuthLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";

import {
  verifyEmailService,
  resendOtpService,
} from "../../services/authService";

import {
  ROUTES,
  MESSAGES,
} from "../../utils/constants";

import { getErrorMessage } from "../../utils/helpers";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    location.state?.email || ""
  );

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);

  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response =
        await verifyEmailService({
          email,
          otp,
        });

      toast.success(
        response.message ||
          MESSAGES.EMAIL_VERIFIED
      );

      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);

    try {
      const response =
        await resendOtpService({
          email,
        });

      toast.success(response.message);
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Email"
      subtitle="Enter the OTP sent to your email"
    >
      <form
        onSubmit={handleVerify}
        className="space-y-4"
      >
        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <Input
          label="OTP"
          type="text"
          name="otp"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value)
          }
          placeholder="Enter 6-digit OTP"
          required
        />

        <Button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Verifying..."
            : "Verify Email"}
        </Button>

        <Button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="bg-gray-600 hover:bg-gray-700"
        >
          {resending
            ? "Sending..."
            : "Resend OTP"}
        </Button>

        <p className="text-center text-sm text-gray-600">
          Already verified?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="font-semibold text-green-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default VerifyEmail;