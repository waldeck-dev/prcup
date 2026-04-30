import type { Score, Status, User, UserScores } from "./types.ts";
import { path, sqlite } from "../dep.ts";

type ScoreRow = {
  repository: string;
  number: number;
  type: string;
  user_login: string;
  user_avatar_url: string;
  user_html_url: string;
  score: number;
  processed: number;
  closed_at: string | null;
};

type ScoreTableInfoRow = {
  name: string;
};

export class ScoreManager {
  private scores: Score[];
  private db: sqlite.DB;

  private cachedUserStatus?: Map<string, Status>;

  constructor(private dbPath: string, private repository: string) {
    this.ensureDatabasePath();
    this.db = new sqlite.DB(this.dbPath);
    this.initializeSchema();
    this.scores = this.readScores();
    this.cachedUserStatus = this.cacheUsersByStatus();
  }

  private ensureDatabasePath(): void {
    const dir = path.dirname(this.dbPath);
    Deno.mkdirSync(dir, { recursive: true });
  }

  private initializeSchema(): void {
    this.db.execute(`
      CREATE TABLE IF NOT EXISTS scores (
        repository TEXT NOT NULL,
        number INTEGER NOT NULL,
        type TEXT NOT NULL,
        user_login TEXT NOT NULL,
        user_avatar_url TEXT NOT NULL,
        user_html_url TEXT NOT NULL,
        score INTEGER NOT NULL,
        processed INTEGER NOT NULL,
        closed_at TEXT,
        PRIMARY KEY (repository, number)
      )
    `);

    this.migrateSchema();
  }

  private migrateSchema(): void {
    const tableInfo = this.db.queryEntries<ScoreTableInfoRow>(
      "PRAGMA table_info(scores)",
    );

    if (!tableInfo.some((column) => column.name === "closed_at")) {
      this.db.execute("ALTER TABLE scores ADD COLUMN closed_at TEXT");
    }
  }

  private readScores(): Score[] {
    const rows = this.db.queryEntries<ScoreRow>(
      `
        SELECT repository, number, type, user_login, user_avatar_url, user_html_url, score, processed, closed_at
        FROM scores
        WHERE repository = ?
      `,
      [this.repository],
    );

    return rows.map((row) => ({
      number: row.number,
      type: row.type as Score["type"],
      user: {
        login: row.user_login,
        avatar_url: row.user_avatar_url,
        html_url: row.user_html_url,
      },
      score: row.score,
      processed: row.processed === 1,
      closed_at: row.closed_at,
    }));
  }

  public writeScores(): void {
    for (const score of this.scores) {
      this.db.query(
        `
          INSERT INTO scores (
            repository,
            number,
            type,
            user_login,
            user_avatar_url,
            user_html_url,
            score,
            processed,
            closed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(repository, number)
          DO UPDATE SET
            type = excluded.type,
            user_login = excluded.user_login,
            user_avatar_url = excluded.user_avatar_url,
            user_html_url = excluded.user_html_url,
            score = excluded.score,
            processed = excluded.processed,
            closed_at = excluded.closed_at
        `,
        [
          this.repository,
          score.number,
          score.type,
          score.user.login,
          score.user.avatar_url,
          score.user.html_url,
          score.score,
          score.processed ? 1 : 0,
          score.closed_at,
        ],
      );
    }
  }

  public getScores(): Score[] {
    return this.scores;
  }

  public getScoreByNumber(number: number): Score | undefined {
    return this.getScores().find((s) => s.number === number);
  }

  private getYearFromClosedAt(closedAt: string | null): number | null {
    if (!closedAt) {
      return null;
    }

    const parsed = new Date(closedAt);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.getUTCFullYear();
  }

  private buildUserScores(status: Status, scores: Score[]): UserScores {
    if (scores.length === 0) {
      return new Map();
    }

    const sumByUser = new Map<string, number>();
    const userDetails = new Map<string, User>();

    for (const score of scores) {
      const login = score.user.login;

      if (this.getUserStatus(login) !== status) {
        continue;
      }

      if (sumByUser.has(login)) {
        sumByUser.set(login, (sumByUser.get(login) || 0) + score.score);
      } else {
        sumByUser.set(login, score.score);
        userDetails.set(login, score.user);
      }
    }

    const rankedScores = Array.from(sumByUser.entries()).sort((
      [, score1],
      [, score2],
    ) => score2 - score1);

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

  public getAvailableYears(includeYear?: number): number[] {
    const years = new Set<number>();

    for (const score of this.getScores()) {
      const year = this.getYearFromClosedAt(score.closed_at);

      if (year !== null) {
        years.add(year);
      }
    }

    if (includeYear) {
      years.add(includeYear);
    }

    return Array.from(years).sort((a, b) => b - a);
  }

  public getUserScoresByYear(
    status: Status,
    year: number,
    includeUndated = false,
  ): UserScores {
    const yearScores = this.getScores().filter((score) => {
      const scoreYear = this.getYearFromClosedAt(score.closed_at);
      return scoreYear === year || (includeUndated && scoreYear === null);
    });

    return this.buildUserScores(status, yearScores);
  }

  public getUserScores(status: Status): UserScores {
    const scores = this.getScores();

    // Skip fast if no scores to process
    if (scores.length === 0) {
      return new Map();
    }

    return this.buildUserScores(status, scores);
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
