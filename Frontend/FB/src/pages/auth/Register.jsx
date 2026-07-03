import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AuthLayout from "../../components/AuthLayout";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";

import { registerService } from "../../services/authService";
import { ROUTES, ROLES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: ROLES.RESIDENT,
    phone: "", vehicleNumber: "", vehiclePhoto: null, idProof: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("role", formData.role);

      if (formData.role === ROLES.COLLECTOR) {
        data.append("phone", formData.phone);
        data.append("vehicleNumber", formData.vehicleNumber);
        data.append("vehiclePhoto", formData.vehiclePhoto);
        data.append("idProof", formData.idProof);
      }

      const response = await registerService(data);
      toast.success(response.message);
      navigate(ROUTES.VERIFY_EMAIL, { state: { email: formData.email } });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join Future Bin">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required />
        <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
        <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required />

        <Select
          label="Role" name="role" value={formData.role} onChange={handleChange}
          options={[{ label: "Resident", value: ROLES.RESIDENT }, { label: "Collector", value: ROLES.COLLECTOR }]}
        />

        {formData.role === ROLES.COLLECTOR && (
          <>
            <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" required />
            <Input label="Vehicle Number" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} placeholder="KL-13-AB-1234" required />

            <div>
              <label className="mb-2 block font-medium text-surface-700">Vehicle Image</label>
              <input type="file" name="vehiclePhoto" accept="image/*" onChange={handleFileChange} required
                className="w-full rounded-lg border border-surface-300 bg-surface p-2 text-surface-700 file:mr-3 file:rounded file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-brand-700" />
            </div>

            <div>
              <label className="mb-2 block font-medium text-surface-700">Government ID Proof</label>
              <input type="file" name="idProof" accept="image/*" onChange={handleFileChange} required
                className="w-full rounded-lg border border-surface-300 bg-surface p-2 text-surface-700 file:mr-3 file:rounded file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-brand-700" />
            </div>
          </>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </Button>

        <p className="text-center text-surface-600">
          Already have an account?{" "}
          <Link to={ROUTES.LOGIN} className="font-semibold text-brand-600 hover:text-brand-700">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
