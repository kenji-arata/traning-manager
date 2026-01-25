import prisma from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({ error: "start_date and end_date are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // トレーニング記録を取得（trainingItemとbodyPartの情報も含む）
    const trainingRecords = await prisma.trainingRecord.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        trainingItem: {
          include: {
            bodyPartMaster: true,
            trainingItemBodyParts: {
              include: {
                bodyPart: true,
              },
            },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // 週ごとにグループ化（部位ID付き）
    const weeklyStats: Record<
      string,
      Record<number, { id: number; name: string; sets: number }>
    > = {};

    trainingRecords.forEach((record) => {
      const recordDate = new Date(record.date);
      const weekStart = getWeekStart(recordDate);
      const weekKey = formatLocalDate(weekStart);

      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = {};
      }

      // メイン部位のセット数を加算（1セット = 1回）
      const mainBodyPart = record.trainingItem.bodyPartMaster;
      if (!weeklyStats[weekKey][mainBodyPart.id]) {
        weeklyStats[weekKey][mainBodyPart.id] = {
          id: mainBodyPart.id,
          name: mainBodyPart.name,
          sets: 0,
        };
      }
      weeklyStats[weekKey][mainBodyPart.id].sets += 1;

      // サブ部位のセット数を加算（1セット = 0.75回）
      record.trainingItem.trainingItemBodyParts.forEach((tbp) => {
        const secondaryBodyPart = tbp.bodyPart;
        if (!weeklyStats[weekKey][secondaryBodyPart.id]) {
          weeklyStats[weekKey][secondaryBodyPart.id] = {
            id: secondaryBodyPart.id,
            name: secondaryBodyPart.name,
            sets: 0,
          };
        }
        weeklyStats[weekKey][secondaryBodyPart.id].sets += 0.75;
      });
    });

    // レスポンスの形式を整える（部位IDでソート、idは除外）
    const result = Object.entries(weeklyStats).map(([weekStart, bodyPartsMap]) => ({
      weekStart,
      bodyParts: Object.values(bodyPartsMap)
        .sort((a, b) => a.id - b.id)
        .map(({ name, sets }) => ({ name, sets })),
    }));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/traning_record/weekly_stats] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ローカル時間でYYYY-MM-DD形式の日付文字列を作成
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 週の開始日（日曜日）を取得するヘルパー関数
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 (日曜) から 6 (土曜)
  const diff = day; // 日曜を基準にする
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
