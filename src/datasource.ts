import { IntegrationBase } from "@budibase/types"
import fetch from "node-fetch"

interface DatasourceConfig {
  host: string
  email: string
  apiKey: string
}

interface ExecuteQuery {
  method?: string
  endpoint: string
  payload?: object | string
}

interface RequestOptions {
  method: string
  body?: string
  headers?: { [key: string]: string }
}

class CustomIntegration {
  private readonly host: string
  private readonly email: string
  private readonly apiKey: string

  constructor(config: DatasourceConfig) {
    this.host = this.cleanHost(config.host)
    this.email = config.email
    this.apiKey = config.apiKey
  }

  private cleanHost(host: string): string {
    return host.replace(/^https?:\/\//, "").replace(/\/+$/, "")
  }

  private cleanEndpoint(endpoint: string): string {
    return endpoint.replace(/^\/+/, "")
  }

  private buildUrl(endpoint: string): string {
    return `https://${this.host}/index.php?/api/v2/${this.cleanEndpoint(endpoint)}`
  }

  private buildAuthHeader(): string {
    return Buffer.from(`${this.email}:${this.apiKey}`).toString("base64")
  }

  async request(url: string, opts: RequestOptions) {
    opts.headers = {
      ...(opts.headers || {}),
      Authorization: `Basic ${this.buildAuthHeader()}`,
      "Content-Type": "application/json",
    }

    const response = await fetch(url, opts)
    const text = await response.text()

    if (!response.ok) {
      throw new Error(`Testrails API error ${response.status}: ${text}`)
    }

    if (!text) {
      return {}
    }

    const contentType = response.headers.get("content-type")

    if (contentType?.includes("json")) {
      return JSON.parse(text)
    }

    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  async execute(query: ExecuteQuery) {
    const method = (query.method || "GET").toUpperCase()
    const url = this.buildUrl(query.endpoint)

    const opts: RequestOptions = {
      method,
    }

    if (query.payload && method !== "GET") {
      opts.body =
        typeof query.payload === "string"
          ? query.payload
          : JSON.stringify(query.payload)
    }

    return this.request(url, opts)
  }
}

export default CustomIntegration