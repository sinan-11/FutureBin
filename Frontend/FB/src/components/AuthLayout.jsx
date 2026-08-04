import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaLeaf, FaRecycle, FaMoneyBillWave, FaRobot } from "react-icons/fa";

const AuthLayout = ({
  title,
  subtitle,
  children,
  backTo,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-12 lg:flex">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-teal-300/20 blur-2xl"
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
            <FaLeaf className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Future<span className="text-emerald-200">Bin</span>
          </span>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight text-white">
            Turn waste into wealth, one pickup at a time.
          </h2>
          <p className="mt-4 max-w-md text-emerald-50/90">
            The smart way for communities to recycle — request pickups, earn rewards,
            and let AI guide your waste habits.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: FaRecycle, text: "Schedule doorstep waste pickups in minutes" },
              { icon: FaMoneyBillWave, text: "Earn money for every kilogram recycled" },
              { icon: FaRobot, text: "AI-powered waste sorting and tips" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-white">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-emerald-100/80">
          &copy; {new Date().getFullYear()} Future Bin. Recycle smart, live green.
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-emerald-500/5 blur-2xl" />
          <div className="absolute -right-24 bottom-24 h-64 w-64 rounded-full bg-teal-500/5 blur-2xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="mb-6 flex items-center justify-center lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <FaLeaf className="h-5 w-5" />
            </div>
          </div>

          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="mb-4 flex items-center gap-1.5 text-sm font-medium text-surface-500 transition hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-800"
            >
              <FaArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          )}

          <div className="card animate-fade-in p-6 shadow-card sm:p-8">
            <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-surface-800 dark:text-surface-800">
              {title}
            </h1>

            {subtitle && (
              <p className="mb-6 text-center text-surface-500 dark:text-surface-400">
                {subtitle}
              </p>
            )}

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
