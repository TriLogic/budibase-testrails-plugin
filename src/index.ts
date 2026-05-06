import fetch from "node-fetch"

interface DatasourceConfig {
  host: string
  email: string
  apiKey: string
}

interface EndpointQuery {
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
    this.email = String(config.email || "")
    this.apiKey = String(config.apiKey || "")
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
    const email = String(this.email || "")
    const apiKey = String(this.apiKey || "")

    if (!email || !apiKey) {
      throw new Error("Missing Testrails email or API key")
    }

    return Buffer.from(`${this.email}:${this.apiKey}`).toString("base64")
  }

  private async call(
    method: string,
    endpoint: string,
    payload?: object | string
  ) {
    const url = this.buildUrl(endpoint)

    const hasPayload =
      payload !== undefined &&
      payload !== null &&
      payload !== ""

    if (!this.host || !this.email || !this.apiKey) {
      throw new Error("Missing Testrails host, email, or API key")
    }

    const opts: RequestOptions = {
      method,
      headers: {
        Authorization: `Basic ${this.buildAuthHeader()}`,
        "Content-Type": "application/json",
      },
    }

    if (payload !== undefined && payload !== null && method !== "GET") {
      opts.body =
        typeof payload === "string" ? payload : JSON.stringify(payload)
    }

    const response = await fetch(url, opts)
    const text = await response.text()

    if (!response.ok) {
      throw new Error(`Testrails API error ${response.status}: ${text}`)
    }

    if (!text) {
      return {}
    }

    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  async read(query: EndpointQuery) {
    if (!query || !query.endpoint) {
      return []
    }
  
    const payload = query.payload
    const hasPayload =
      payload !== undefined &&
      payload !== null &&
      payload !== ""

    const method = hasPayload ? "POST" : "GET"
    return this.call("GET", query.endpoint)
  }

  async create(query: EndpointQuery) {
    return this.call("POST", query.endpoint, query.payload)
  }

  async update(query: EndpointQuery) {
    return this.call("POST", query.endpoint, query.payload)
  }

  async delete(query: EndpointQuery) {
    return this.call("POST", query.endpoint, query.payload)
  }
}

export default CustomIntegration