import { getInitials } from "../utils/helpers";

const palette = [
  "bg-emerald-500",
  "bg-teal-500",
  "bg-blue-500",
  "bg-info-600",
  "bg-amber-500",
  "bg-danger-500",
  "bg-violet-500",
  "bg-rose-500",
];

const Avatar = ({
  name = "",
  src,
  size = "md",
  className = "",
  online = false,
}) => {
  const sizes = {
    xs: "h-7 w-7 text-[10px]",
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  };

  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const color = palette[hash % palette.length];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-surface-100`}
        />
      ) : (
        <div
          className={`${sizes[size]} flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white dark:ring-surface-100 ${color}`}
        >
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-success-500 dark:border-surface-100" />
      )}
    </div>
  );
};

export default Avatar;
