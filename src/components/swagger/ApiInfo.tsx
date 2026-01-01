import { jsx, RawHtml } from "../../jsx-runtime"
import type { ApiInfo as ApiInfoType } from "./types"

interface Props {
  info: ApiInfoType
}

export function ApiInfo({ info }: Props): RawHtml {
  return (
    <header className="bg-gray-900 text-white p-8 rounded-lg mb-8">
      <h1 className="text-3xl font-bold mb-2">{info.title}</h1>
      <span className="inline-block bg-green-500 text-white px-2 py-1 rounded text-sm font-semibold">
        v{info.version}
      </span>
      {info.description && (
        <p className="mt-4 text-gray-300">{info.description}</p>
      )}
    </header>
  )
}
