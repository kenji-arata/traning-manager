import { NextResponse } from "next/server";

export async function GET() {
  const data = ["a", "b"];
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return NextResponse.json(data);
}
