import { HttpApiBuilder, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import { AppApi } from "../api/api";
import { ContactFormSchema } from "../forms/definitions/contact";
import { parseFormData } from "../forms/parser";
import { ContactPage } from "../components/ContactPage";
import { ContactSuccessPage } from "../components/ContactSuccessPage";

export const ContactHandlerLive = HttpApiBuilder.group(AppApi, "contact", (handlers) =>
  handlers
    .handleRaw("getContactPage", () =>
      Effect.sync(() => {
        const html = "<!DOCTYPE html>" + ContactPage({});
        return HttpServerResponse.html(html);
      })
    )
    .handleRaw("submitContact", () =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        // Access the underlying Web Request's formData method via source property
        const source = (request as unknown as { source: Request }).source;
        const formData = yield* Effect.tryPromise({
          try: () => source.formData(),
          catch: () => new Error("Failed to parse form data"),
        });

        // Try to parse - on success redirect, on failure show errors
        const parseResult = yield* parseFormData(ContactFormSchema, formData).pipe(
          Effect.match({
            onFailure: (formState) => {
              const html = "<!DOCTYPE html>" + ContactPage({ state: formState });
              return HttpServerResponse.text(html, {
                contentType: "text/html",
                status: 422,
              });
            },
            onSuccess: (data) => {
              // Process the validated data
              // In a real app, you would send an email, save to DB, etc.
              console.log("Contact form submitted:", data);

              // POST/redirect/GET pattern
              return HttpServerResponse.redirect("/contact/success", { status: 303 });
            },
          })
        );

        return parseResult;
      }).pipe(
        // Handle any unexpected errors by showing a generic error page
        Effect.catchAll(() =>
          Effect.succeed(
            HttpServerResponse.text("<!DOCTYPE html><html><body>Error processing form</body></html>", {
              contentType: "text/html",
              status: 500,
            })
          )
        )
      )
    )
    .handleRaw("getContactSuccess", () =>
      Effect.sync(() => {
        const html = "<!DOCTYPE html>" + ContactSuccessPage();
        return HttpServerResponse.html(html);
      })
    )
);
