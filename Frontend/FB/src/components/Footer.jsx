import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../utils/constants";

const Footer = () => {
  const [year] = useState(() => new Date().getFullYear());

  return (
    <footer className="border-t border-surface-200 bg-surface py-8 text-center text-surface-500">
      <div className="mx-auto max-w-7xl px-4">
        <Link to={ROUTES.HOME} className="text-lg font-bold text-brand-600">
          Future Bin
        </Link>
        <p className="mt-2 text-sm">
          &copy; {year} Future Bin. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
