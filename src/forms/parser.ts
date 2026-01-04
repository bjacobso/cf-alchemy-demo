/**
 * FormData parser with Effect Schema validation
 */
import { Effect, Either, ParseResult, Schema } from "effect";
import { ArrayFormatter } from "effect/ParseResult";
import type { FormErrors, FormState } from "./types";

/** Convert FormData to a plain object, handling arrays */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    // Skip internal fields
    if (key.startsWith("_")) continue;

    // Handle array fields (name="items[]" or multiple values)
    if (key.endsWith("[]")) {
      const arrayKey = key.slice(0, -2);
      const existing = obj[arrayKey];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        obj[arrayKey] = [value];
      }
    } else if (obj[key] !== undefined) {
      // Multiple values for same key -> convert to array
      const existing = obj[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        obj[key] = [existing, value];
      }
    } else {
      obj[key] = value;
    }
  }

  return obj;
}

/** Parse FormData with Effect Schema, returning typed result or FormState with errors */
export function parseFormData<A, I, R>(
  schema: Schema.Schema<A, I, R>,
  formData: FormData,
): Effect.Effect<A, FormState<A>, R> {
  const rawData = formDataToObject(formData);

  return Schema.decodeUnknown(schema)(rawData).pipe(
    Effect.mapError((parseError): FormState<A> => {
      const errors = parseResultToFormErrors<A>(parseError);
      return {
        values: rawData as Partial<A>,
        errors,
        touched: new Set(Object.keys(rawData) as (keyof A)[]),
      };
    }),
  );
}

/** Synchronous version returning Either */
export function parseFormDataSync<A, I>(
  schema: Schema.Schema<A, I, never>,
  formData: FormData,
): Either.Either<A, FormState<A>> {
  const rawData = formDataToObject(formData);

  const result = Schema.decodeUnknownEither(schema)(rawData);

  return Either.mapLeft(result, (parseError): FormState<A> => {
    const errors = parseResultToFormErrors<A>(parseError);
    return {
      values: rawData as Partial<A>,
      errors,
      touched: new Set(Object.keys(rawData) as (keyof A)[]),
    };
  });
}

/** Convert Effect ParseError to field-level errors using ArrayFormatter */
function parseResultToFormErrors<T>(error: ParseResult.ParseError): FormErrors<T> {
  const errors: Record<string, string[]> = {};

  // Use ArrayFormatter to get a flat list of errors with paths
  const issues = ArrayFormatter.formatErrorSync(error);

  for (const issue of issues) {
    // Path is an array of property names/indices
    const path = issue.path.join(".") || "_form";
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }

  return errors as FormErrors<T>;
}
