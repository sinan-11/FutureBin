import { useRef, useEffect } from "react";

const OtpInput = ({ length = 6, value, onChange, disabled }) => {
  const inputsRef = useRef([]);

  useEffect(() => {
    if (inputsRef.current[0]) inputsRef.current[0].focus();
  }, []);

  const handleChange = (index, e) => {
    const char = e.target.value.replace(/\D/g, "").slice(0, 1);
    if (!char) return;
    const otpArr = value.split("");
    otpArr[index] = char;
    const newOtp = otpArr.join("").slice(0, length);
    onChange(newOtp);
    if (index < length - 1 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (value[index]) {
        const otpArr = value.split("");
        otpArr[index] = "";
        onChange(otpArr.join(""));
      } else if (index > 0 && inputsRef.current[index - 1]) {
        inputsRef.current[index - 1].focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextIdx = Math.min(pasted.length, length - 1);
      if (inputsRef.current[nextIdx]) inputsRef.current[nextIdx].focus();
    }
  };

  const chars = value.padEnd(length, "").split("").slice(0, length);

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={chars[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className="h-14 w-12 rounded-xl border-2 border-surface-200 bg-surface text-center text-2xl font-bold text-surface-800 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 disabled:opacity-50 dark:border-surface-200 dark:bg-surface-100 dark:text-surface-800"
        />
      ))}
    </div>
  );
};

export default OtpInput;
