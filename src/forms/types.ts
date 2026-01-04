/**
 * Core types for the Form DSL
 */

/** Form state passed to components after validation failure */
export interface FormState<T> {
  readonly values: Partial<T>;
  readonly errors: FormErrors<T>;
  readonly touched: ReadonlySet<keyof T>;
}

/** Field-level errors keyed by field name, with optional form-level errors */
export type FormErrors<T> = {
  readonly [K in keyof T]?: readonly string[];
} & {
  readonly _form?: readonly string[];
};

/** Supported input types for form fields */
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "checkbox"
  | "select"
  | "textarea"
  | "hidden"
  | "tel"
  | "url"
  | "date";

/** Configuration for rendering a form field */
export interface FieldConfig {
  readonly name: string;
  readonly type: FieldType;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly options?: readonly SelectOption[];
  readonly rows?: number;
  readonly min?: number | string;
  readonly max?: number | string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly patternMessage?: string;
}

/** Option for select fields */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/** Create an empty form state */
export function emptyFormState<T>(): FormState<T> {
  return {
    values: {},
    errors: {} as FormErrors<T>,
    touched: new Set(),
  };
}

/** Check if form state has any errors */
export function hasErrors<T>(state: FormState<T> | undefined): boolean {
  if (!state) return false;
  return Object.keys(state.errors).length > 0;
}

/** Get errors for a specific field */
export function getFieldErrors<T>(
  state: FormState<T> | undefined,
  field: keyof T,
): readonly string[] | undefined {
  return state?.errors[field];
}
