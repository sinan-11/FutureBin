import { FaLeaf, FaRecycle, FaRoute, FaRobot, FaWallet, FaShieldAlt, FaCheckCircle, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import { ROUTES } from "../utils/constants";
import useAuth from "../hooks/useAuth";
import { getDashboardRoute } from "../utils/helpers";

const FEATURES = [
  {
    icon: FaRecycle,
    title: "On-Demand Pickups",
    description:
      "Request waste collection in a few taps. Real-time availability, transparent scheduling, and live tracking from doorstep to facility.",
  },
  {
    icon: FaRoute,
    title: "Live Route Tracking",
    description:
      "Watch your assigned collector approach on an interactive map. Know exactly when to bring your bins out.",
  },
  {
    icon: FaRobot,
    title: "AI Assistant",
    description:
      "Ask about pickups, wallets, subscriptions, and earnings in plain language. Get instant answers and one-tap actions.",
  },
  {
    icon: FaWallet,
    title: "Smart Wallet",
    description:
      "Pay for subscriptions, earn from waste, and track every transaction from a single, secure wallet.",
  },
  {
    icon: FaShieldAlt,
    title: "Verified Collectors",
    description:
      "Every collector is identity-verified and rated. Rate your pickup and keep the community trustworthy.",
  },
  {
    icon: FaLeaf,
    title: "Built for a Cleaner Tomorrow",
    description:
      "Automated scheduling and optimized routes reduce carbon footprint — a smarter way to manage waste for everyone.",
  },
];

const Home = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <Layout>
      <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
            <FaLeaf className="h-4 w-4 text-emerald-200" />
            Smart Waste Management Platform
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-7xl animate-fade-in">
            Waste Collection,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-white">
              Reimagined
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-white/70 md:text-xl animate-fade-in">
            A smarter way to manage waste collection. Real-time tracking,
            automated scheduling, and a cleaner tomorrow for everyone.
          </p>

          {!isLoggedIn && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-slide-up">
              <Link
                to={ROUTES.REGISTER}
                className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-emerald-800 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
              >
                Get Started
                <FaArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
              >
                Sign In
              </Link>
            </div>
          )}

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
            {[
              { value: "Real-time", label: "Tracking" },
              { value: "100%", label: "Secure" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm"
              >
                <p className="text-xl font-extrabold text-white sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-emerald-100/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              Everything you need
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-surface-900 dark:text-surface-900 sm:text-4xl">
              One platform for the entire{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                waste lifecycle
              </span>
            </h2>
            <p className="mt-4 text-surface-600 dark:text-surface-500">
              From requesting a pickup to tracking earnings — FutureBin connects
              residents, collectors, and admins in a single seamless workflow.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="card card-hover flex flex-col rounded-2xl p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/25">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 px-8 py-14 text-center shadow-xl shadow-emerald-700/20">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Ready for a cleaner community?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/80">
                Join residents and collectors already building a smarter waste
                management future with FutureBin.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                {!isLoggedIn && (
                  <>
                    <Link
                      to={ROUTES.REGISTER}
                      className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
                    >
                      Create an account
                      <FaArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      to={ROUTES.LOGIN}
                      className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
                    >
                      <FaCheckCircle className="h-4 w-4" />
                      Sign In
                    </Link>
                  </>
                )}
                {isLoggedIn && (
                  <Link
                    to={getDashboardRoute(user.role)}
                    className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
                  >
                    Go to Dashboard
                    <FaArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
