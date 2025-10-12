export const BaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // クライアントサイドでは相対URL
    return "";
  }

  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
};
