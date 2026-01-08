import { jsx, Fragment, RawHtml } from "../../jsx-runtime";
import type { FormState } from "../types";

interface FormProps<T> {
  action: string;
  method?: "post" | "get" | undefined;
  state?: FormState<T> | undefined;
  children?: RawHtml | RawHtml[] | undefined;
  className?: string | undefined;
  id?: string | undefined;
  enctype?: "application/x-www-form-urlencoded" | "multipart/form-data" | undefined;
}

export function Form<T>({
  action,
  method = "post",
  state,
  children,
  className,
  id,
  enctype,
}: FormProps<T>): RawHtml {
  const formId = id ?? `form-${action.replace(/\W/g, "-")}`;

  return (
    <form
      id={formId}
      action={action}
      method={method}
      className={className}
      enctype={enctype}
      data-enhanced="false"
      novalidate
    >
      {children}
    </form>
  );
}
