import prisma from "../../../lib/prisma";
import { TrainingRecordSchema } from "../../schema/schema";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const trainingItemId = searchParams.get("training_item_id");

    // 検索条件の構築
    const where: Prisma.TrainingRecordWhereInput = {};

    // 日付範囲の条件
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        // end_dateは指定された日の終わりまで含める
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.date.lte = endDateTime;
      }
    }

    // トレーニング種目IDの条件
    if (trainingItemId) {
      const parsedId = parseInt(trainingItemId, 10);
      if (!isNaN(parsedId)) {
        where.trainingItemId = parsedId;
      }
    }

    const trainingRecords = await prisma.trainingRecord.findMany({
      where,
      include: {
        trainingItem: true,
      },
      orderBy: { date: "desc" },
    });

    return new Response(JSON.stringify(trainingRecords), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/traning_record] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 日付文字列をDateオブジェクトに変換
    const dataToValidate = {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    };

    const parsedBody = TrainingRecordSchema.safeParse(dataToValidate);

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

    // トレーニング種目が存在するか確認
    const trainingItem = await prisma.trainingItem.findUnique({
      where: { id: parsedBody.data.trainingItemId },
    });

    if (!trainingItem) {
      return new Response(JSON.stringify({ error: "Training item not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const trainingRecord = await prisma.trainingRecord.create({
      data: {
        date: parsedBody.data.date,
        trainingItemId: parsedBody.data.trainingItemId,
        weight: parsedBody.data.weight,
        repetitions: parsedBody.data.repetitions,
      },
      include: {
        trainingItem: true,
      },
    });

    return new Response(JSON.stringify(trainingRecord), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /api/traning_record] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // 日付文字列をDateオブジェクトに変換
    const dataToValidate = {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    };

    const parsedBody = TrainingRecordSchema.safeParse(dataToValidate);

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

    // 更新の場合はidが必須
    if (!parsedBody.data.id) {
      return new Response(JSON.stringify({ error: "ID is required for update." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 対象のトレーニング記録が存在するか確認
    const existingRecord = await prisma.trainingRecord.findUnique({
      where: { id: parsedBody.data.id },
    });

    if (!existingRecord) {
      return new Response(JSON.stringify({ error: "Training record not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // トレーニング種目が存在するか確認
    const trainingItem = await prisma.trainingItem.findUnique({
      where: { id: parsedBody.data.trainingItemId },
    });

    if (!trainingItem) {
      return new Response(JSON.stringify({ error: "Training item not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedRecord = await prisma.trainingRecord.update({
      where: { id: parsedBody.data.id },
      data: {
        date: parsedBody.data.date,
        trainingItemId: parsedBody.data.trainingItemId,
        weight: parsedBody.data.weight,
        repetitions: parsedBody.data.repetitions,
      },
      include: {
        trainingItem: true,
      },
    });

    return new Response(JSON.stringify(updatedRecord), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PUT /api/traning_record] Error:", error);
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
    const existingRecord = await prisma.trainingRecord.findUnique({
      where: { id },
      include: {
        trainingItem: true,
      },
    });
    if (!existingRecord) {
      return new Response(JSON.stringify({ error: "Training record not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    await prisma.trainingRecord.delete({
      where: { id },
    });
    return new Response(
      JSON.stringify({
        message: "Training record deleted successfully.",
        deletedRecord: existingRecord,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[DELETE /api/traning_record] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const ReplaceRecordsSchema = z.object({
  date: z.string(),
  records: z.array(
    z.object({
      trainingItemId: z.number(),
      weight: z.number(),
      repetitions: z.number(),
    }),
  ),
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = ReplaceRecordsSchema.safeParse(body);
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
    const { date, records } = parsedBody.data;
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const trainingItemIds = [...new Set(records.map((r) => r.trainingItemId))];
    const existingItems = await prisma.trainingItem.findMany({
      where: { id: { in: trainingItemIds } },
    });
    if (existingItems.length !== trainingItemIds.length) {
      const foundIds = existingItems.map((item) => item.id);
      const missingIds = trainingItemIds.filter((id) => !foundIds.includes(id));
      return new Response(
        JSON.stringify({
          error: "Training items not found.",
          missingIds,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const result = await prisma.$transaction(async (tx) => {
      await tx.trainingRecord.deleteMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      const createdRecords = await tx.trainingRecord.createManyAndReturn({
        data: records.map((record) => ({
          date: targetDate,
          trainingItemId: record.trainingItemId,
          weight: record.weight,
          repetitions: record.repetitions,
        })),
      });
      const recordsWithItems = await tx.trainingRecord.findMany({
        where: {
          id: { in: createdRecords.map((r) => r.id) },
        },
        include: {
          trainingItem: true,
        },
      });
      return recordsWithItems;
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PATCH /api/traning_record] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
