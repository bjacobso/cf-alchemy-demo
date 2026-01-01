// Wrapper class to mark strings as safe HTML (already rendered)
export class RawHtml {
  constructor(public readonly html: string) {}
  toString() {
    return this.html
  }
}

type Child = RawHtml | string | number | boolean | null | undefined | Child[]
type Props = Record<string, unknown> & { children?: Child }

// JSX namespace for TypeScript
declare global {
  namespace JSX {
    type Element = RawHtml
    interface IntrinsicElements {
      [elemName: string]: Props
    }
  }
}

function raw(html: string): RawHtml {
  return new RawHtml(html)
}

function isRaw(value: unknown): value is RawHtml {
  return value instanceof RawHtml
}

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
])

function escapeHtml(str: string): string {
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  )
}

function renderChildren(children: Child): string {
  if (children == null || children === false) return ""
  if (Array.isArray(children)) return children.map(renderChildren).join("")
  if (isRaw(children)) return children.html // Already rendered HTML
  return escapeHtml(String(children))
}

export function jsx(
  type: string | ((props: Props) => RawHtml),
  props: Props | null,
  ...children: Child[]
): RawHtml {
  const safeProps = props ?? {}
  const { dangerouslySetInnerHTML, ...attrs } = safeProps

  // Merge children from props and rest arguments
  const allChildren =
    children.length > 0 ? children : (safeProps.children as Child)

  if (typeof type === "function") {
    return type({ ...safeProps, children: allChildren })
  }

  const attrStr = Object.entries(attrs)
    .filter(([k, v]) => v != null && v !== false && k !== "children")
    .map(([k, v]) => {
      const name = k === "className" ? "class" : k
      if (v === true) return ` ${name}`
      return ` ${name}="${escapeHtml(String(v))}"`
    })
    .join("")

  if (VOID_ELEMENTS.has(type)) {
    return raw(`<${type}${attrStr}>`)
  }

  const content =
    (dangerouslySetInnerHTML as { __html: string } | undefined)?.__html ??
    renderChildren(allChildren)
  return raw(`<${type}${attrStr}>${content}</${type}>`)
}

export const jsxs = jsx

export function Fragment({ children }: Props): RawHtml {
  return raw(renderChildren(children))
}
