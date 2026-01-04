/**
 * Schema field builders with form annotations
 *
 * Each builder returns an Effect Schema with annotations for form rendering.
 */
import { Schema } from "effect";
import type { FieldType, SelectOption } from "./types";

/** Annotation symbols for form metadata */
export const FieldTypeId = Symbol.for("@forms/FieldType");
export const LabelId = Symbol.for("@forms/Label");
export const PlaceholderId = Symbol.for("@forms/Placeholder");
export const OptionsId = Symbol.for("@forms/Options");

/** Get form annotations from a schema */
export function getFormAnnotations(schema: Schema.Schema.Any): {
  type: FieldType | undefined;
  label: string | undefined;
  placeholder: string | undefined;
  options: readonly SelectOption[] | undefined;
} {
  const annotations = schema.ast.annotations;
  return {
    type: annotations[FieldTypeId] as FieldType | undefined,
    label: annotations[LabelId] as string | undefined,
    placeholder: annotations[PlaceholderId] as string | undefined,
    options: annotations[OptionsId] as readonly SelectOption[] | undefined,
  };
}

/** Text input field */
export function TextField(
  label: string,
  options?: {
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
  },
) {
  let schema = Schema.String;

  if (options?.minLength !== undefined && options?.maxLength !== undefined) {
    schema = schema.pipe(Schema.minLength(options.minLength), Schema.maxLength(options.maxLength));
  } else if (options?.minLength !== undefined) {
    schema = schema.pipe(Schema.minLength(options.minLength));
  } else if (options?.maxLength !== undefined) {
    schema = schema.pipe(Schema.maxLength(options.maxLength));
  }

  return schema.annotations({
    [FieldTypeId]: "text" as FieldType,
    [LabelId]: label,
    [PlaceholderId]: options?.placeholder,
  });
}

/** Email input field with validation */
export function EmailField(
  label: string,
  options?: {
    placeholder?: string;
  },
) {
  return Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: () => "Invalid email address" }),
  ).annotations({
    [FieldTypeId]: "email" as FieldType,
    [LabelId]: label,
    [PlaceholderId]: options?.placeholder ?? "email@example.com",
  });
}

/** Password input field */
export function PasswordField(
  label: string,
  options?: {
    minLength?: number;
    placeholder?: string;
  },
) {
  const minLen = options?.minLength ?? 8;
  return Schema.String.pipe(
    Schema.minLength(minLen, { message: () => `Password must be at least ${minLen} characters` }),
  ).annotations({
    [FieldTypeId]: "password" as FieldType,
    [LabelId]: label,
    [PlaceholderId]: options?.placeholder,
  });
}

/** Number input field */
export function NumberField(
  label: string,
  options?: {
    min?: number;
    max?: number;
    placeholder?: string;
  },
) {
  // Start with NumberFromString and chain filters
  const base = Schema.NumberFromString;

  if (options?.min !== undefined && options?.max !== undefined) {
    return base
      .pipe(
        Schema.greaterThanOrEqualTo(options.min, {
          message: () => `Must be at least ${options.min}`,
        }),
        Schema.lessThanOrEqualTo(options.max, { message: () => `Must be at most ${options.max}` }),
      )
      .annotations({
        [FieldTypeId]: "number" as FieldType,
        [LabelId]: label,
        [PlaceholderId]: options?.placeholder,
      });
  } else if (options?.min !== undefined) {
    return base
      .pipe(
        Schema.greaterThanOrEqualTo(options.min, {
          message: () => `Must be at least ${options.min}`,
        }),
      )
      .annotations({
        [FieldTypeId]: "number" as FieldType,
        [LabelId]: label,
        [PlaceholderId]: options?.placeholder,
      });
  } else if (options?.max !== undefined) {
    return base
      .pipe(
        Schema.lessThanOrEqualTo(options.max, { message: () => `Must be at most ${options.max}` }),
      )
      .annotations({
        [FieldTypeId]: "number" as FieldType,
        [LabelId]: label,
        [PlaceholderId]: options?.placeholder,
      });
  }

  return base.annotations({
    [FieldTypeId]: "number" as FieldType,
    [LabelId]: label,
    [PlaceholderId]: options?.placeholder,
  });
}

/** Checkbox field (converts "on" string or undefined to boolean) */
export function CheckboxField(label: string) {
  // HTML checkboxes send "on" when checked, nothing when unchecked
  // We accept "on", "", or undefined and convert to boolean
  const OnOrEmpty = Schema.Union(Schema.Literal("on"), Schema.Literal(""), Schema.Undefined);

  return Schema.transform(OnOrEmpty, Schema.Boolean, {
    strict: true,
    decode: (v) => v === "on",
    encode: (v) => (v ? ("on" as const) : undefined),
  }).annotations({
    [FieldTypeId]: "checkbox" as FieldType,
    [LabelId]: label,
  });
}

/** Select dropdown field */
export function SelectField<T extends string>(
  label: string,
  options: readonly { value: T; label: string }[],
) {
  const values = options.map((o) => o.value) as [T, ...T[]];
  return Schema.Literal(...values).annotations({
    [FieldTypeId]: "select" as FieldType,
    [LabelId]: label,
    [OptionsId]: options,
  });
}

/** Textarea field */
export function TextareaField(
  label: string,
  options?: {
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
  },
) {
  let schema = Schema.String;

  if (options?.minLength !== undefined && options?.maxLength !== undefined) {
    schema = schema.pipe(Schema.minLength(options.minLength), Schema.maxLength(options.maxLength));
  } else if (options?.minLength !== undefined) {
    schema = schema.pipe(Schema.minLength(options.minLength));
  } else if (options?.maxLength !== undefined) {
    schema = schema.pipe(Schema.maxLength(options.maxLength));
  }

  return schema.annotations({
    [FieldTypeId]: "textarea" as FieldType,
    [LabelId]: label,
    [PlaceholderId]: options?.placeholder,
  });
}

/** Hidden field (no label) */
export function HiddenField() {
  return Schema.String.annotations({
    [FieldTypeId]: "hidden" as FieldType,
  });
}

/** URL input field with validation */
export function UrlField(
  label: string,
  options?: {
    placeholder?: string;
  },
) {
  return Schema.String.pipe(
    Schema.pattern(/^https?:\/\/.+/, {
      message: () => "Must be a valid URL starting with http:// or https://",
    }),
  ).annotations({
    [FieldTypeId]: "url" as FieldType,
    [LabelId]: label,
    [PlaceholderId]: options?.placeholder ?? "https://example.com",
  });
}

/** Phone/tel input field */
export function TelField(
  label: string,
  options?: {
    placeholder?: string;
  },
) {
  return Schema.String.annotations({
    [FieldTypeId]: "tel" as FieldType,
    [LabelId]: label,
    [PlaceholderId]: options?.placeholder ?? "(555) 555-5555",
  });
}

/** Date input field */
export function DateField(label: string) {
  return Schema.String.pipe(
    Schema.pattern(/^\d{4}-\d{2}-\d{2}$/, { message: () => "Must be a valid date" }),
  ).annotations({
    [FieldTypeId]: "date" as FieldType,
    [LabelId]: label,
  });
}

/** Make a field optional (wraps in Schema.optional) */
export function optional<S extends Schema.Schema.Any>(schema: S) {
  return Schema.optional(schema);
}
