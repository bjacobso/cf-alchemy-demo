import { jsx, Fragment, RawHtml } from "../jsx-runtime";
import { FormLayout } from "./FormLayout";
import { Form, Field, ErrorSummary, Submit } from "../forms";
import type { FormState } from "../forms";
import type { ContactFormData } from "../forms/definitions/contact";

interface ContactPageProps {
  state?: FormState<ContactFormData> | undefined;
}

export function ContactPage({ state }: ContactPageProps): RawHtml {
  return (
    <FormLayout title="Contact Us">
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
          <p className="text-gray-600 mb-6">
            We'd love to hear from you. Fill out the form below and we'll get back to you soon.
          </p>

          <Form action="/contact" state={state}>
            <ErrorSummary errors={state?.errors} />

            <Field
              name="name"
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={state?.values?.name}
              errors={state?.errors?.name}
              required
              minLength={2}
            />

            <Field
              name="email"
              type="email"
              label="Email Address"
              placeholder="john@example.com"
              value={state?.values?.email}
              errors={state?.errors?.email}
              required
            />

            <Field
              name="subject"
              type="select"
              label="Subject"
              value={state?.values?.subject}
              errors={state?.errors?.subject}
              options={[
                { value: "general", label: "General Inquiry" },
                { value: "support", label: "Technical Support" },
                { value: "sales", label: "Sales" },
                { value: "feedback", label: "Feedback" },
              ]}
              required
            />

            <Field
              name="message"
              type="textarea"
              label="Message"
              placeholder="Enter your message..."
              value={state?.values?.message}
              errors={state?.errors?.message}
              required
              rows={6}
              minLength={10}
            />

            <Field
              name="subscribe"
              type="checkbox"
              label="Subscribe to our newsletter"
              value={state?.values?.subscribe}
              errors={state?.errors?.subscribe}
            />

            <Submit label="Send Message" loadingLabel="Sending..." />
          </Form>

          <p className="mt-6 text-center text-sm text-gray-500">
            <a href="/" className="text-blue-600 hover:underline">
              &larr; Back to home
            </a>
          </p>
        </div>
      </div>
    </FormLayout>
  );
}
