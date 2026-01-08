/**
 * Example: Contact form schema
 */
import { Schema } from "effect";
import { TextField, EmailField, SelectField, TextareaField, CheckboxField } from "../schema";

export const ContactFormSchema = Schema.Struct({
  name: TextField("Full Name", { minLength: 2, placeholder: "John Doe" }),
  email: EmailField("Email Address"),
  subject: SelectField("Subject", [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "sales", label: "Sales" },
    { value: "feedback", label: "Feedback" },
  ]),
  message: TextareaField("Message", { minLength: 10, placeholder: "Enter your message..." }),
  subscribe: CheckboxField("Subscribe to newsletter"),
});

export type ContactFormData = Schema.Schema.Type<typeof ContactFormSchema>;
