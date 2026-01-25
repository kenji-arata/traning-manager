import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const bodyParts = await prisma.bodyPartMaster.findMany({
      orderBy: { id: "asc" },
    });

    return new Response(JSON.stringify(bodyParts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/body_part] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
