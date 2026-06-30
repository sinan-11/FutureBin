const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow transition hover:shadow-lg">
      <div className={`mb-4 text-4xl ${color}`}>
        {icon}
      </div>

      <h3 className="text-gray-500">{title}</h3>

      <p className="mt-2 text-4xl font-bold">
        {value}
      </p>
    </div>
  );
};

export default StatCard;