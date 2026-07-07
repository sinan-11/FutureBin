import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import Card from "./Card";

const AuthLayout = ({
  title,
  subtitle,
  children,
  backTo,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-100 via-surface to-brand-50 p-6">
      <Card className="relative w-full max-w-md overflow-hidden">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200 active:scale-90"
          >
            <FaArrowLeft className="h-3.5 w-3.5 text-gray-600" />
          </button>
        )}

        <h1 className="mb-2 text-center text-3xl font-bold text-brand-700">
          {title}
        </h1>

        {subtitle && (
          <p className="mb-6 text-center text-surface-500">
            {subtitle}
          </p>
        )}

        {children}
      </Card>
    </div>
  );
};

export default AuthLayout;
