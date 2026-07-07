import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AuthLayout from "../../components/AuthLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";
import useAuth from "../../hooks/useAuth";

import { loginService } from "../../services/authService";
import { ROUTES, MESSAGES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginService(formData);
      toast.success(response.message || MESSAGES.LOGIN_SUCCESS);
      navigate(ROUTES.HOME, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Login to Future Bin" backTo={ROUTES.HOME}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
        <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required />

        <div className="text-right">
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>

        <p className="text-center text-sm text-surface-600">
          Don't have an account?{" "}
          <Link to={ROUTES.REGISTER} className="font-semibold text-brand-600 hover:text-brand-700">
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
