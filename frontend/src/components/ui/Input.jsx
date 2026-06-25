import React, { forwardRef } from "react";

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon = null,
  suffix = null,
  type = "text",
  className = "",
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative rounded-xl">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={`
            w-full px-4 py-2.5 border rounded-xl text-sm transition-all duration-200 bg-white
            focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400
            ${icon ? "pl-10" : ""}
            ${suffix ? "pr-10" : ""}
            ${
              error
                ? "border-red-400 focus:ring-red-400 text-red-900 placeholder-red-300"
                : "border-gray-300 focus:ring-primary-500 focus:border-transparent text-gray-900"
            }
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-gray-500 mt-1.5">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
