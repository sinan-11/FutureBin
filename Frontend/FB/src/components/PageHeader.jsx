import { FaChevronRight } from "react-icons/fa";

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  breadcrumb,
  className = "",
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumb && (
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-surface-400 dark:text-surface-500">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <FaChevronRight className="h-2.5 w-2.5 opacity-60" />}
              <span
                className={
                  i === breadcrumb.length - 1
                    ? "font-medium text-surface-600 dark:text-surface-400"
                    : ""
                }
              >
                {item}
              </span>
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/20">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-surface-800 sm:text-2xl dark:text-surface-800">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
