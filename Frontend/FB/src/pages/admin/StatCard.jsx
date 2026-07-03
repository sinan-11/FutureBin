const StatCard = ({ title, value, icon, color = "text-brand-600", onClick }) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-surface-200 bg-surface p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className={`text-3xl ${color}`}>{icon}</div>
      <p className="mt-4 text-surface-500">{title}</p>
      <p className={`mt-1 text-4xl font-bold ${color}`}>{value}</p>
    </div>
  );
};

export default StatCard;
