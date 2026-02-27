"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl text-sm text-white
            bg-white/5 backdrop-blur-sm
            border border-white/10
            focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
            transition-all duration-200 appearance-none
            ${error ? "border-red-500/50" : ""}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export default Select;
