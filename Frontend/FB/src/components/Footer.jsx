import { useState } from "react";
import { Link } from "react-router-dom";
import { FaLeaf, FaRecycle } from "react-icons/fa";
import { ROUTES } from "../utils/constants";

const Footer = () => {
  const [year] = useState(() => new Date().getFullYear());

  return (
    <footer className="border-t border-surface-200 bg-surface py-10 dark:border-surface-200/60 dark:bg-surface-100">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition group-hover:scale-105">
              <FaLeaf className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="text-lg font-extrabold tracking-tight text-surface-800 dark:text-surface-800">
                Future<span className="text-emerald-600 dark:text-emerald-400">Bin</span>
              </span>
              <p className="text-xs text-surface-500 dark:text-surface-400">Recycle smart, live green</p>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
            <Link to={ROUTES.HOME} className="transition hover:text-emerald-700 dark:hover:text-emerald-400">
              Home
            </Link>
            <span className="flex items-center gap-1.5">
              <FaRecycle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {year} Future Bin
            </span>
          </div>
        </div>

        <p className="mt-6 border-t border-surface-100 pt-5 text-center text-xs text-surface-400 dark:border-surface-200/60 dark:text-surface-500">
          &copy; {year} Future Bin. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
