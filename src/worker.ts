import { ScoreManager } from "./scores.ts";
import GithubApi from "./GithubApi.ts";

export class PrCupWorker {
  constructor(
    private numbers: number[],
    private scoreManager: ScoreManager,
    private GithubApi: GithubApi,
  ) {
  }

  private async getUnprocessedItems(): Promise<number[]> {
    const latestItem = Math.max(
      await this.GithubApi.getLatestPull(),
      await this.GithubApi.getLatestIssue(),
    );

    return [...this.numbers].filter((n) =>
      n <= latestItem && !this.scoreManager.scoreExistsForItem(n)
    );
  }
}
