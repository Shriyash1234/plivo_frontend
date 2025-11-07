const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4500/api";

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  buildHeaders(extraHeaders = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...extraHeaders,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;
    const config = {
      method: options.method || "GET",
      headers: this.buildHeaders(options.headers),
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
      const payload = isJson ? await response.json() : null;

      if (!response.ok) {
        const error = new Error(payload?.message || "Request failed");
        error.status = response.status;
        error.details = payload;
        throw error;
      }

      return payload;
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Unable to reach the server. Please check API base URL."
        );
      }
      throw error;
    }
  }

  get(path) {
    return this.request(path);
  }

  post(path, body) {
    return this.request(path, { method: "POST", body });
  }

  put(path, body) {
    return this.request(path, { method: "PUT", body });
  }

  delete(path) {
    return this.request(path, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
export const API_URL = API_BASE_URL;
