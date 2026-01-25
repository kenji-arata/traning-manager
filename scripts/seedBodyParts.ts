import prisma from "../lib/prisma";

async function main() {
  const bodyParts = [
    { name: "肩" },
    { name: "腕" },
    { name: "背中" },
    { name: "胸" },
    { name: "足" },
  ];

  console.log("BodyPartMasterにデータを追加しています...");

  for (const bodyPart of bodyParts) {
    const created = await prisma.bodyPartMaster.upsert({
      where: { name: bodyPart.name },
      update: {},
      create: bodyPart,
    });
    console.log(`✓ ${created.name} (ID: ${created.id})`);
  }

  console.log("完了しました！");
}

main()
  .catch((e) => {
    console.error("エラーが発生しました:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
