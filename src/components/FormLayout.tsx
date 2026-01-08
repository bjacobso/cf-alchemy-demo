import { jsx, Fragment, RawHtml } from "../jsx-runtime";
import { tailwindCSS } from "../styles/tailwind.generated";

let formsEnhanceScript: string | undefined;
try {
  // Dynamic import at module load - will fail if not built yet
  const mod = await import("../forms/client/enhance.generated");
  formsEnhanceScript = mod.formsEnhanceScript;
} catch {
  // Script not built yet, progressive enhancement will be disabled
}

interface FormLayoutProps {
  title: string;
  children?: RawHtml | RawHtml[];
}

export function FormLayout({ title, children }: FormLayoutProps): RawHtml {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <style dangerouslySetInnerHTML={{ __html: tailwindCSS }} />
      </head>
      <body>
        {children}
        {formsEnhanceScript && <script dangerouslySetInnerHTML={{ __html: formsEnhanceScript }} />}
      </body>
    </html>
  );
}
