import prisma from "../../../lib/prisma";
import { TrainingItemSchema } from "../../schema/schema";

export async function GET() {
  try {
    const trainingItems = await prisma.trainingItem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        bodyPartMaster: true,
        trainingItemBodyParts: {
          select: {
            bodyPartId: true,
          },
        },
      },
    });

    // secondaryBodyPartIdsを含む形式に変換
    const formattedItems = trainingItems.map((item) => ({
      ...item,
      secondaryBodyPartIds: item.trainingItemBodyParts.map((bp) => bp.bodyPartId),
      trainingItemBodyParts: undefined,
    }));

    return new Response(JSON.stringify(formattedItems), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/training_item] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = TrainingItemSchema.safeParse(body);

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

    const trainingItem = await prisma.trainingItem.create({
      data: {
        name: parsedBody.data.name,
        bodyPartMasterId: parsedBody.data.bodyPartMasterId,
        trainingItemBodyParts: parsedBody.data.secondaryBodyPartIds
          ? {
              create: parsedBody.data.secondaryBodyPartIds.map((bodyPartId) => ({
                bodyPartId,
              })),
            }
          : undefined,
      },
      include: {
        bodyPartMaster: true,
        trainingItemBodyParts: {
          select: {
            bodyPartId: true,
          },
        },
      },
    });

    // secondaryBodyPartIdsを含む形式に変換
    const formattedItem = {
      ...trainingItem,
      secondaryBodyPartIds: (trainingItem.trainingItemBodyParts as { bodyPartId: number }[]).map(
        (bp: { bodyPartId: number }) => bp.bodyPartId,
      ),
      trainingItemBodyParts: undefined,
    };

    return new Response(JSON.stringify(formattedItem), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /api/training_item] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = TrainingItemSchema.safeParse(body);

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

    // 対象のトレーニング種別が存在するか確認
    const existingItem = await prisma.trainingItem.findUnique({
      where: { id: parsedBody.data.id },
    });

    if (!existingItem) {
      return new Response(JSON.stringify({ error: "Training item not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedItem = await prisma.trainingItem.update({
      where: { id: parsedBody.data.id },
      data: {
        name: parsedBody.data.name,
        bodyPartMasterId: parsedBody.data.bodyPartMasterId,
        trainingItemBodyParts: {
          // 既存のsecondaryBodyPartsを削除
          deleteMany: {},
          // 新しいsecondaryBodyPartsを作成
          create: parsedBody.data.secondaryBodyPartIds
            ? parsedBody.data.secondaryBodyPartIds.map((bodyPartId) => ({
                bodyPartId,
              }))
            : [],
        },
      },
      include: {
        bodyPartMaster: true,
        trainingItemBodyParts: {
          select: {
            bodyPartId: true,
          },
        },
      },
    });

    // secondaryBodyPartIdsを含む形式に変換
    const formattedItem = {
      ...updatedItem,
      secondaryBodyPartIds: updatedItem.trainingItemBodyParts.map((bp) => bp.bodyPartId),
      trainingItemBodyParts: undefined,
    };

    return new Response(JSON.stringify(formattedItem), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PUT /api/training_item] Error:", error);
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

    // IDが指定されているか確認
    if (!idParam) {
      return new Response(JSON.stringify({ error: "ID parameter is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = parseInt(idParam, 10);

    // IDが有効な数値か確認
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: "Invalid ID format." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 対象のトレーニング種別が存在するか確認
    const existingItem = await prisma.trainingItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return new Response(JSON.stringify({ error: "Training item not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // トレーニング種別を削除
    await prisma.trainingItem.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({
        message: "Training item deleted successfully.",
        deletedItem: existingItem,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[DELETE /api/training_item] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
