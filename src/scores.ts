import type { Score, Status, User, UserScores } from "./types.ts";

export class ScoreManager {
  private scores: Score[];
  private filename: string;
  private filepath: string;

  private cachedUserStatus?: Map<string, Status>;

  constructor(private dataDirectory: string, private repository: string) {
    this.filename = `${
      this.repository.replaceAll("/", "-").toLowerCase()
    }.json`;
    this.filepath = `${this.dataDirectory}/${this.filename}`;
    this.scores = this.readScores();
    this.cachedUserStatus = this.cacheUsersByStatus();
  }

  private readScores(): Score[] {
    let data: string;

    try {
      data = Deno.readTextFileSync(this.filepath);
    } catch (_err) {
      data = "[]";
      Deno.writeTextFileSync(this.filepath, JSON.stringify(data));
    }

    return JSON.parse(data);
  }

  public writeScores(): void {
    Deno.writeTextFileSync(this.filepath, JSON.stringify(this.scores, null, 2));
  }

  public getScores(): Score[] {
    return this.scores;
  }

  public getScoreByNumber(number: number): Score | undefined {
    return this.getScores().find((s) => s.number === number);
  }

  public getUserScores(status: Status): UserScores {
    const scores = this.getScores();

    // Skip fast if no scores to process
    if (scores.length === 0) {
      return new Map();
    }

    const sumByUser = new Map<string, number>();
    const userDetails = new Map<string, User>();

    // Calculate sums by User
    for (const score of scores) {
      const login = score.user.login;

      if (this.getUserStatus(login) !== status) {
        continue; // Skip users not matching the status
      }

      if (sumByUser.has(login)) {
        sumByUser.set(login, (sumByUser.get(login) || 0) + score.score);
      } else {
        sumByUser.set(login, score.score);
        userDetails.set(login, score.user);
      }
    }

    // Rank scores
    const rankedScores = Array.from(sumByUser.entries()).sort((
      [, score1],
      [, score2],
    ) => score2 - score1);

    // Positions
    const positions: UserScores = new Map();
    let currentPos = 1;
    let currentScore = NaN;
    let counter = 0;

    for (const [login, score] of rankedScores) {
      counter++;

      if (Number.isNaN(currentScore)) {
        currentScore = score;
      }

      if (currentScore > score) {
        currentPos = counter;
        currentScore = score;
      }

      const userScoreData = {
        user: {
          login,
          avatar_url: userDetails.get(login)?.avatar_url || "",
          html_url: userDetails.get(login)?.html_url || "",
          status: this.getUserStatus(login),
        },
        scores: scores.filter((s) => s.user.login === login),
      };

      if (positions.has(currentPos)) {
        positions.get(currentPos)?.push(userScoreData);
      } else {
        positions.set(currentPos, [userScoreData]);
      }
    }

    return positions;
  }

  public addScore(score: Score): void {
    this.scores.push(score);
  }

  public updateScore(score: Score): void {
    const oldScore = this.getScoreByNumber(score.number);
    if (!oldScore) {
      console.warn(`Item #${score.number} does not exists in Scores.`);
      return;
    }
    Object.assign(oldScore, score);
  }

  public scoreExistsForItem(number: number): boolean {
    for (const score of this.scores) {
      if (score.number === number) {
        return true;
      }
    }
    return false;
  }

  public cacheUsersByStatus(): typeof this.cachedUserStatus | undefined {
    const activeUsers = Deno.env.get("ACTIVE_USERS");
    if (!activeUsers) {
      console.warn("No ACTIVE_USERS environment variable set.");
      return undefined;
    }

    const users = activeUsers.split(",").map((u) => u.trim().toLowerCase());
    const map: Map<string, Status> = new Map();

    for (const user of users) {
      if (map.has(user)) {
        continue;
      } else {
        map.set(user, "active");
      }
    }

    return map;
  }

  public getUserStatus(login: string): Status {
    if (!this.cachedUserStatus || this.cachedUserStatus.size === 0) {
      return "active"; // Default active if no status is defined
    }
    const status = this.cachedUserStatus.get(login.toLowerCase());
    return status || "inactive"; // Default to inactive if not found
  }
}
