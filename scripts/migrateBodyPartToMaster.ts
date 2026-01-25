import prisma from "../lib/prisma";

/**
 * 既存のTrainingItemレコードのbodyPartMasterIdを更新するスクリプト
 *
 * bodyPart (enum) から bodyPartMasterId への移行
 * マッピング:
 * - ARM → 2
 * - SHOULDER → 1
 * - CHEST → 4
 * - LEG → 5
 * - BACK → 3
 * - ABS → (指定なし)
 */

const BODY_PART_TO_MASTER_ID_MAP: Record<string, number> = {
  ARM: 2,
  SHOULDER: 1,
  CHEST: 4,
  LEG: 5,
  BACK: 3,
};

async function main() {
  console.log("TrainingItemのbodyPartMasterIdを更新しています...");

  // 全てのTrainingItemを取得
  const trainingItems = await prisma.trainingItem.findMany();

  console.log(`対象レコード数: ${trainingItems.length}件`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const item of trainingItems) {
    const bodyPartMasterId = BODY_PART_TO_MASTER_ID_MAP[item.bodyPart];

    if (!bodyPartMasterId) {
      console.log(
        `⚠️  スキップ: ID ${item.id} (${item.name}) - bodyPart: ${item.bodyPart} のマッピングが見つかりません`,
      );
      skippedCount++;
      continue;
    }

    try {
      await prisma.trainingItem.update({
        where: { id: item.id },
        data: { bodyPartMasterId },
      });

      console.log(
        `✓ 更新: ID ${item.id} (${item.name}) - ${item.bodyPart} → BodyPartMaster ID ${bodyPartMasterId}`,
      );
      successCount++;
    } catch (error) {
      console.error(
        `✗ エラー: ID ${item.id} (${item.name}) - ${error instanceof Error ? error.message : String(error)}`,
      );
      errorCount++;
    }
  }

  console.log("\n=== 実行結果 ===");
  console.log(`成功: ${successCount}件`);
  console.log(`スキップ: ${skippedCount}件`);
  console.log(`エラー: ${errorCount}件`);
  console.log(`合計: ${trainingItems.length}件`);
}

main()
  .catch((e) => {
    console.error("エラーが発生しました:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
