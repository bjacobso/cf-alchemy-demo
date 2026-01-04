import { jsx, RawHtml } from "../../jsx-runtime";

interface SubmitProps {
  label?: string;
  className?: string;
  disabled?: boolean;
  loadingLabel?: string;
}

export function Submit({
  label = "Submit",
  className,
  disabled,
  loadingLabel = "Submitting...",
}: SubmitProps): RawHtml {
  const defaultClass =
    "w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      type="submit"
      className={className ?? defaultClass}
      disabled={disabled}
      data-loading-label={loadingLabel}
    >
      {label}
    </button>
  );
}
