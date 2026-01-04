import { jsx, Fragment, RawHtml } from "../../jsx-runtime";
import type { FieldType, SelectOption } from "../types";

interface FieldProps {
  name: string;
  type?: FieldType | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
  value?: string | number | boolean | undefined;
  errors?: readonly string[] | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  options?: readonly SelectOption[] | undefined;
  className?: string | undefined;
  rows?: number | undefined;
  min?: number | string | undefined;
  max?: number | string | undefined;
  minLength?: number | undefined;
  maxLength?: number | undefined;
  pattern?: string | undefined;
  patternMessage?: string | undefined;
  autoComplete?: string | undefined;
}

export function Field({
  name,
  type = "text",
  label,
  placeholder,
  value,
  errors,
  required,
  disabled,
  options,
  className,
  rows = 4,
  min,
  max,
  minLength,
  maxLength,
  pattern,
  patternMessage,
  autoComplete,
}: FieldProps): RawHtml {
  const hasErrors = errors && errors.length > 0;
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;

  const baseInputClass = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2";
  const errorInputClass = hasErrors
    ? "border-red-500 focus:ring-red-500"
    : "border-gray-300 focus:ring-blue-500";
  const inputClass = `${baseInputClass} ${errorInputClass} ${className ?? ""}`;

  const renderInput = (): RawHtml => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            id={inputId}
            name={name}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={inputClass}
            rows={rows}
            minlength={minLength}
            maxlength={maxLength}
            aria-invalid={hasErrors ? "true" : undefined}
            aria-describedby={hasErrors ? errorId : undefined}
          >
            {String(value ?? "")}
          </textarea>
        );

      case "select":
        return (
          <select
            id={inputId}
            name={name}
            required={required}
            disabled={disabled}
            className={inputClass}
            aria-invalid={hasErrors ? "true" : undefined}
            aria-describedby={hasErrors ? errorId : undefined}
          >
            <option value="">Select...</option>
            {options?.map((opt) => (
              <option value={opt.value} selected={value === opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <input
              id={inputId}
              type="checkbox"
              name={name}
              value="on"
              checked={Boolean(value)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-invalid={hasErrors ? "true" : undefined}
              aria-describedby={hasErrors ? errorId : undefined}
            />
            {label && (
              <label htmlFor={inputId} className="text-sm text-gray-700">
                {label}
              </label>
            )}
          </div>
        );

      case "hidden":
        return <input type="hidden" name={name} value={String(value ?? "")} />;

      default:
        return (
          <input
            id={inputId}
            type={type}
            name={name}
            value={String(value ?? "")}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={inputClass}
            min={min}
            max={max}
            minlength={minLength}
            maxlength={maxLength}
            pattern={pattern}
            data-pattern-message={patternMessage}
            autocomplete={autoComplete}
            aria-invalid={hasErrors ? "true" : undefined}
            aria-describedby={hasErrors ? errorId : undefined}
          />
        );
    }
  };

  // Hidden fields have no label or error display
  if (type === "hidden") {
    return renderInput();
  }

  // Checkbox has label inline
  if (type === "checkbox") {
    return (
      <div className="mb-4">
        {renderInput()}
        {hasErrors && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {errors.join(", ")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {hasErrors && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {errors.join(", ")}
        </p>
      )}
    </div>
  );
}
