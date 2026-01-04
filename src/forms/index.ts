/**
 * Form DSL - Type-safe forms with Effect Schema validation
 *
 * @example
 * ```tsx
 * import { Schema } from "effect";
 * import * as F from "./forms";
 *
 * // Define form schema
 * const ContactSchema = Schema.Struct({
 *   name: F.TextField("Name", { minLength: 2 }),
 *   email: F.EmailField("Email"),
 *   message: F.TextareaField("Message", { minLength: 10 }),
 * });
 *
 * // Render form
 * <F.Form action="/contact" state={formState}>
 *   <F.ErrorSummary errors={formState?.errors} />
 *   <F.Field name="name" label="Name" value={formState?.values?.name} errors={formState?.errors?.name} />
 *   <F.Field name="email" type="email" label="Email" value={formState?.values?.email} errors={formState?.errors?.email} />
 *   <F.Field name="message" type="textarea" label="Message" value={formState?.values?.message} errors={formState?.errors?.message} />
 *   <F.Submit label="Send" />
 * </F.Form>
 *
 * // Parse in handler
 * const result = yield* F.parseFormData(ContactSchema, formData).pipe(Effect.either);
 * ```
 */

// Types
export type { FormState, FormErrors, FieldConfig, FieldType, SelectOption } from "./types";
export { emptyFormState, hasErrors, getFieldErrors } from "./types";

// Schema builders
export {
  TextField,
  EmailField,
  PasswordField,
  NumberField,
  CheckboxField,
  SelectField,
  TextareaField,
  HiddenField,
  UrlField,
  TelField,
  DateField,
  optional,
  getFormAnnotations,
  FieldTypeId,
  LabelId,
  PlaceholderId,
  OptionsId,
} from "./schema";

// Parser
export { parseFormData, parseFormDataSync, formDataToObject } from "./parser";

// Components
export { Form } from "./components/Form";
export { Field } from "./components/Field";
export { ErrorSummary } from "./components/ErrorSummary";
export { Submit } from "./components/Submit";
