import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const BackButton = ({ to, className = "" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/");
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow-md active:scale-90 ${className}`}
      aria-label="Go back"
    >
      <FaArrowLeft className="h-4 w-4 text-gray-700" />
    </button>
  );
};

export default BackButton;
