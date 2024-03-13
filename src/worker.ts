import { ScoreManager } from "./scores.ts";
import GithubApi from "./GithubApi.ts";
import { ItemTypeEnum } from "./types.ts";
import { Score, User } from "./types.ts";
import { Pull } from "./types.ts";
import { Issue } from "./types.ts";
import { PageGenerator } from "../ui/generator.ts";

const PULL_OK = parseInt(Deno.env.get("PULL_OK") || "3");
const PULL_NOK = parseInt(Deno.env.get("PULL_NOK") || "-3");
const ISSUE_OK = parseInt(Deno.env.get("ISSUE_OK") || "1");
const ISSUE_NOK = parseInt(Deno.env.get("ISSUE_NOK") || "-1");

export class PrCupWorker {
  constructor(
    private repository: string,
    private numbers: number[],
    private scoreManager: ScoreManager,
    private GithubApi: GithubApi,
  ) {
  }

  private async getUnprocessedItems(): Promise<
    { unprocessedItems: number[]; latestItem: number }
  > {
    const latestItem = Math.max(
      await this.GithubApi.getLatestPull(),
      await this.GithubApi.getLatestIssue(),
    );

    return {
      unprocessedItems: [...this.numbers].filter((n) =>
      n <= latestItem && !this.scoreManager.scoreExistsForItem(n)
      ),
      latestItem,
    };
  }

  private getNextTarget(latestItem: number): number | null {
    for (const n of this.numbers) {
      if (n > latestItem) {
        return n;
      }
    }
    return null;
  }

  private formatUserData(user: User): User {
    return {
      avatar_url: user.avatar_url,
      html_url: user.html_url,
      login: user.login,
    };
  }

  private shouldBeProcessed(data: Pull | Issue): boolean {
    if (data.type === ItemTypeEnum.PULL) {
      return data.state === "closed";
    }
    if (data.type === ItemTypeEnum.ISSUE) {
      return data.state_reason === "completed";
    }
    return true;
  }

  private calculateScore(item: Pull | Issue, processed: boolean): number {
    if (processed === false) {
      return 0;
    }

    if (item.type === ItemTypeEnum.PULL) {
      return item.merged ? PULL_OK : PULL_NOK;
    }

    if (item.type === ItemTypeEnum.ISSUE) {
      switch (item.state_reason) {
        case "completed":
          return ISSUE_OK;
        case "not_planned":
          return ISSUE_NOK;
        default:
          return 0;
      }
    }

    return 0;
  }

  private newScore(item: Pull | Issue, processed: boolean): Score {
    return {
      number: item.number,
      type: item.type,
      user: this.formatUserData(item.assignee || item.user),
      score: this.calculateScore(item, processed),
      processed,
    };
  }

  public async run(): Promise<void> {
    // Process all new Pull Requests / Issues
    let { unprocessedItems, latestItem } = await this.getUnprocessedItems();

    for (const item of unprocessedItems) {
      console.info(`Getting score for item #${item}`);
      const data = await this.GithubApi.getItemByNumber(item);
      this.scoreManager.addScore(
        this.newScore(data, this.shouldBeProcessed(data)),
      );
      if (item > latestItem) {
        latestItem = item;
      }
    }

    // Update previously processed Pull Requests / Issues if not in final state
    const unfinishedItems = this.scoreManager.getScores().filter((s) =>
      s.processed === false
    ).map((s) => s.number);

    for (const item of unfinishedItems) {
      console.info(`Updating score for item #${item}`);
      const data = await this.GithubApi.getItemByNumber(item);
      this.scoreManager.updateScore(
        this.newScore(data, this.shouldBeProcessed(data)),
      );
    }

    // Save to file
    this.scoreManager.writeScores();

    // Generate static pages
    const gen = new PageGenerator(this.repository);
    gen.generatePage("scores.njk", {
      rankedScores: this.scoreManager.getUserScores(),
      nextTarget: this.getNextTarget(latestItem),
    });
  }
}
