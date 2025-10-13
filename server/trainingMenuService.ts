// トレーニングメニューのビジネスロジック
export interface TrainingMenuService {
  getTrainingMenus(day?: string): Promise<string[]>;
}

export class TrainingMenuServiceImpl implements TrainingMenuService {
  async getTrainingMenus(day?: string): Promise<string[]> {
    const data = ["a", "b"];

    // dayパラメータがある場合は追加
    if (day) {
      data.push(`day: ${day}`);
    }

    // 2秒間スリープ（実際の処理をシミュレート）
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return data;
  }
}

// シングルトンインスタンス
export const trainingMenuService = new TrainingMenuServiceImpl();
