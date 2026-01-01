import { jsx, RawHtml } from "../../jsx-runtime"
import type { ApiInfo as ApiInfoType } from "./types"

interface Props {
  info: ApiInfoType
}

export function ApiInfo({ info }: Props): RawHtml {
  return (
    <header className="api-info">
      <h1>{info.title}</h1>
      <span className="version">v{info.version}</span>
      {info.description && <p className="description">{info.description}</p>}
    </header>
  )
}
