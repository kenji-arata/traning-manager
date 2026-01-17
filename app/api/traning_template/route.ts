import prisma from "../../../lib/prisma";
import { TrainingTemplateWithRecordsSchema } from "../../schema/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        return new Response(JSON.stringify({ error: "Invalid ID format." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const template = await prisma.trainingTemplate.findUnique({
        where: { id },
        include: {
          trainingRecordTemplates: {
            include: {
              trainingItem: true,
            },
            orderBy: { id: "asc" },
          },
        },
      });
      if (!template) {
        return new Response(JSON.stringify({ error: "Template not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(template), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const templates = await prisma.trainingTemplate.findMany({
      include: {
        trainingRecordTemplates: {
          include: {
            trainingItem: true,
          },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return new Response(JSON.stringify(templates), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/traning_template] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = TrainingTemplateWithRecordsSchema.safeParse(body);
    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request.",
          details: parsedBody.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const trainingItemIds = parsedBody.data.trainingRecordTemplates.map((t) => t.trainingItemId);
    const uniqueItemIds = [...new Set(trainingItemIds)];
    const trainingItems = await prisma.trainingItem.findMany({
      where: { id: { in: uniqueItemIds } },
    });
    if (trainingItems.length !== uniqueItemIds.length) {
      return new Response(JSON.stringify({ error: "Some training items not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const template = await prisma.trainingTemplate.create({
      data: {
        name: parsedBody.data.name,
        trainingRecordTemplates: {
          create: parsedBody.data.trainingRecordTemplates.map((record) => ({
            trainingItemId: record.trainingItemId,
            weight: record.weight,
            repetitions: record.repetitions,
          })),
        },
      },
      include: {
        trainingRecordTemplates: {
          include: {
            trainingItem: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });
    return new Response(JSON.stringify(template), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /api/traning_template] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = TrainingTemplateWithRecordsSchema.safeParse(body);
    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request.",
          details: parsedBody.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    if (!parsedBody.data.id) {
      return new Response(JSON.stringify({ error: "ID is required for update." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const existingTemplate = await prisma.trainingTemplate.findUnique({
      where: { id: parsedBody.data.id },
      include: {
        trainingRecordTemplates: true,
      },
    });
    if (!existingTemplate) {
      return new Response(JSON.stringify({ error: "Template not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const trainingItemIds = parsedBody.data.trainingRecordTemplates.map((t) => t.trainingItemId);
    const uniqueItemIds = [...new Set(trainingItemIds)];
    const trainingItems = await prisma.trainingItem.findMany({
      where: { id: { in: uniqueItemIds } },
    });
    if (trainingItems.length !== uniqueItemIds.length) {
      return new Response(JSON.stringify({ error: "Some training items not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const template = await prisma.$transaction(async (tx) => {
      await tx.trainingRecordTemplate.deleteMany({
        where: { trainingTemplateId: parsedBody.data.id },
      });
      return await tx.trainingTemplate.update({
        where: { id: parsedBody.data.id },
        data: {
          name: parsedBody.data.name,
          trainingRecordTemplates: {
            create: parsedBody.data.trainingRecordTemplates.map((record) => ({
              trainingItemId: record.trainingItemId,
              weight: record.weight,
              repetitions: record.repetitions,
            })),
          },
        },
        include: {
          trainingRecordTemplates: {
            include: {
              trainingItem: true,
            },
            orderBy: { id: "asc" },
          },
        },
      });
    });
    return new Response(JSON.stringify(template), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PUT /api/traning_template] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return new Response(JSON.stringify({ error: "ID parameter is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: "Invalid ID format." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const existingTemplate = await prisma.trainingTemplate.findUnique({
      where: { id },
      include: {
        trainingRecordTemplates: {
          include: {
            trainingItem: true,
          },
        },
      },
    });
    if (!existingTemplate) {
      return new Response(JSON.stringify({ error: "Template not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    await prisma.trainingTemplate.delete({
      where: { id },
    });
    return new Response(
      JSON.stringify({
        message: "Template deleted successfully.",
        deletedTemplate: existingTemplate,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[DELETE /api/traning_template] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
