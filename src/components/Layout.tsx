import { jsx, Fragment, RawHtml } from "../jsx-runtime"
import { tailwindCSS } from "../styles/tailwind.generated"

interface LayoutProps {
  title: string
  children?: RawHtml | RawHtml[]
}

export function Layout({ title, children }: LayoutProps): RawHtml {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <style dangerouslySetInnerHTML={{ __html: tailwindCSS }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
