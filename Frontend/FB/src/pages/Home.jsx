import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import { ROUTES } from "../utils/constants";

const Home = () => {
  return (
    <Layout>
      <section className="flex min-h-[85vh] items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-3xl px-6 text-center">
          <h1 className="mb-6 text-6xl font-bold text-green-700">
            Future Bin
          </h1>

          <p className="mb-8 text-xl text-gray-600">
            Smart Waste Collection &
            Management System
          </p>

          <div className="mb-16 flex justify-center gap-5">
            <Link
              to={ROUTES.LOGIN}
              className="rounded-xl bg-green-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-green-700"
            >
              Login
            </Link>

            <Link
              to={ROUTES.REGISTER}
              className="rounded-xl border-2 border-green-600 px-8 py-3 text-lg font-semibold text-green-600 transition hover:bg-green-600 hover:text-white"
            >
              Register
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-2 text-xl font-semibold text-green-600">
                Resident
              </h2>

              <p className="text-gray-600">
                Request waste collection and
                share your location.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-2 text-xl font-semibold text-green-600">
                Collector
              </h2>

              <p className="text-gray-600">
                Manage availability and collect
                waste efficiently.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-2 text-xl font-semibold text-green-600">
                Admin
              </h2>

              <p className="text-gray-600">
                Approve collectors and monitor
                the entire system.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;