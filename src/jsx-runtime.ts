/**
 * Custom JSX Runtime
 *
 * This is a minimal JSX-to-string renderer (~100 lines) that demonstrates
 * how JSX works at a fundamental level without React.
 *
 * Note: This module is used by the legacy components (Counter.tsx, Layout.tsx,
 * SwaggerUI.tsx) which use @jsx pragma comments to override the default
 * React JSX factory. New components should use React.
 */

// Wrapper class to mark strings as safe HTML (already rendered)
export class RawHtml {
  constructor(public readonly html: string) {}
  toString() {
    return this.html;
  }
}

type Child = RawHtml | string | number | boolean | null | undefined | Child[];
type Props = Record<string, unknown> & { children?: Child };

// Type alias to avoid oxfmt corruption of function types in unions
type ComponentFn = (props: Props) => RawHtml;
type JsxType = string | ComponentFn;

// Note: We don't declare a global JSX namespace here because it conflicts
// with React's JSX types. Files using this custom runtime should use
// @jsx pragmas to override the JSX factory per-file.

function raw(html: string): RawHtml {
  return new RawHtml(html);
}

function isRaw(value: unknown): boolean {
  return value instanceof RawHtml;
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
]);

function escapeHtml(str: string): string {
  return str.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function renderChildren(children: Child): string {
  if (children == null || children === false) return "";
  if (Array.isArray(children)) return children.map(renderChildren).join("");
  if (isRaw(children)) return (children as RawHtml).html;
  return escapeHtml(String(children));
}

export function jsx(type: JsxType, props: Props | null, ...children: Child[]): RawHtml {
  const safeProps = props ?? {};
  const { dangerouslySetInnerHTML, ...attrs } = safeProps;

  // Merge children from props and rest arguments
  const allChildren = children.length > 0 ? children : (safeProps.children as Child);

  if (typeof type === "function") {
    return type({ ...safeProps, children: allChildren });
  }

  const attrStr = Object.entries(attrs)
    .filter(([k, v]) => v != null && v !== false && k !== "children")
    .map(([k, v]) => {
      const name = k === "className" ? "class" : k;
      if (v === true) return ` ${name}`;
      return ` ${name}="${escapeHtml(String(v))}"`;
    })
    .join("");

  if (VOID_ELEMENTS.has(type)) {
    return raw(`<${type}${attrStr}>`);
  }

  const content =
    (dangerouslySetInnerHTML as { __html: string } | undefined)?.__html ??
    renderChildren(allChildren);
  return raw(`<${type}${attrStr}>${content}</${type}>`);
}

export const jsxs = jsx;

export function Fragment({ children }: Props): RawHtml {
  return raw(renderChildren(children));
}
