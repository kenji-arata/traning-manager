import prisma from "../../../lib/prisma";
import { ScoreSchema } from "@/schema/schema";

export async function GET() {
  try {
    const scores = await prisma.score.findMany({
      orderBy: { score: "desc" },
    });

    return new Response(JSON.stringify(scores), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = ScoreSchema.safeParse(body);
    if (!parsedBody.success) {
      return new Response(JSON.stringify({ error: "Bad Request." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const score = await prisma.score.create({
      data: parsedBody.data,
    });

    return new Response(JSON.stringify(score), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
