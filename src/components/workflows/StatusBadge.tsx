import { jsx, RawHtml } from "../../jsx-runtime";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps): RawHtml {
  const colors: Record<string, string> = {
    running: "bg-blue-100 text-blue-800",
    suspended: "bg-yellow-100 text-yellow-800",
    done: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    interrupted: "bg-gray-100 text-gray-800",
  };

  const colorClass = colors[status] || "bg-gray-100 text-gray-800";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
}
