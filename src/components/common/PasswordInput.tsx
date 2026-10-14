import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  leftIcon?: React.ReactNode;
};

export const PasswordInput: React.FC<PasswordInputProps> = ({ leftIcon, className = "", ...props }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative rounded-lg shadow-sm">
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          {leftIcon}
        </div>
      )}
      <input {...props} type={show ? "text" : "password"} className={`${className} pr-9`} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none focus:text-indigo-400"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};
