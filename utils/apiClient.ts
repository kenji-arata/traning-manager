/**
 * ベースURLを取得する関数
 */
export const BaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // クライアントサイドでは相対URL
    return "";
  }

  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
};

/**
 * API呼び出しのヘルパークラス
 */
export class ApiClient {
  private static getBaseUrl(): string {
    return BaseUrl();
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `APIエラー: ${response.status}`);
    }
    return response.json();
  }

  static async get<T>(path: string): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;
    const response = await fetch(url, {
      cache: "no-store",
    });
    return this.handleResponse<T>(response);
  }

  static async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  static async put<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  static async delete<T>(path: string): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;
    const response = await fetch(url, {
      method: "DELETE",
    });
    return this.handleResponse<T>(response);
  }
  static async patch<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }
}
