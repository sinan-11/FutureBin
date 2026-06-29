import { Link } from "react-router-dom";

import { ROUTES } from "../utils/constants";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          to={ROUTES.HOME}
          className="text-2xl font-bold text-green-600"
        >
          Future Bin
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.LOGIN}
            className="rounded-lg border border-green-600 px-4 py-2 text-green-600 transition hover:bg-green-50"
          >
            Login
          </Link>

          <Link
            to={ROUTES.REGISTER}
            className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;