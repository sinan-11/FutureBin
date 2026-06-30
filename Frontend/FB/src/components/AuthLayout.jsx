import Card from "./Card";

const AuthLayout = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-100 via-white to-green-50 p-6">
      <Card className="w-full max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-green-600">
          {title}
        </h1>

        {subtitle && (
          <p className="mb-6 text-center text-gray-500">
            {subtitle}
          </p>
        )}

        {children}
      </Card>
    </div>
  );
};

export default AuthLayout;