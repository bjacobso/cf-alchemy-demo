// OpenAPI 3.0 spec types for SwaggerUI component

export interface OpenAPISpec {
  openapi: string
  info: ApiInfo
  paths: Record<string, PathItem>
  tags?: Tag[]
  components?: Components
}

export interface ApiInfo {
  title: string
  version: string
  description?: string
}

export interface Tag {
  name: string
  description?: string
}

export interface PathItem {
  get?: Operation
  post?: Operation
  put?: Operation
  delete?: Operation
  patch?: Operation
}

export type HttpMethod = "get" | "post" | "put" | "delete" | "patch"

export interface Operation {
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, Response>
}

export interface Parameter {
  name: string
  in: "query" | "path" | "header" | "cookie"
  required?: boolean
  description?: string
  schema?: SchemaObject
}

export interface RequestBody {
  description?: string
  required?: boolean
  content: Record<string, MediaType>
}

export interface Response {
  description: string
  content?: Record<string, MediaType>
}

export interface MediaType {
  schema?: SchemaObject
}

export interface SchemaObject {
  type?: string
  format?: string
  properties?: Record<string, SchemaObject>
  items?: SchemaObject
  required?: string[]
  $ref?: string
  description?: string
  enum?: string[]
}

export interface Components {
  schemas?: Record<string, SchemaObject>
}

// Helper type for grouped endpoints
export interface EndpointInfo {
  path: string
  method: HttpMethod
  operation: Operation
}
