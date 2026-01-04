import { jsx, Fragment, RawHtml } from "../../jsx-runtime";
import type { FormErrors } from "../types";

interface ErrorSummaryProps<T> {
  errors?: FormErrors<T> | undefined;
  title?: string | undefined;
}

export function ErrorSummary<T>({
  errors,
  title = "Please fix the following errors:",
}: ErrorSummaryProps<T>): RawHtml {
  if (!errors) return <Fragment />;

  const allErrors = Object.entries(errors).flatMap(([field, fieldErrors]) =>
    (fieldErrors as string[] | undefined)?.map((e) => ({ field, message: e })) ?? []
  );

  if (allErrors.length === 0) return <Fragment />;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md" role="alert">
      <h2 className="text-lg font-semibold text-red-800 mb-2">{title}</h2>
      <ul className="list-disc list-inside text-sm text-red-700">
        {allErrors.map(({ field, message }) => (
          <li>
            {field !== "_form" && (
              <Fragment>
                <strong>{formatFieldName(field)}:</strong>{" "}
              </Fragment>
            )}
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
