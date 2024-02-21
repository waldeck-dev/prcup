import type { Score } from "./types.ts";

export class ScoreManager {
  private scores: Score[];

  constructor(private filepath: string) {
    this.filepath = filepath;
    this.scores = this.readScores();
  }

  private readScores(): Score[] {
    const data = Deno.readTextFileSync(this.filepath);
    return JSON.parse(data);
  }

  private writeScores(scores: Score[]): void {
    Deno.writeTextFileSync(this.filepath, JSON.stringify(scores));
  }

  public getScores(): Score[] {
    return this.scores;
  }

  public addScore(score: Score): void {
    const newScores = this.getScores();
    newScores.push(score);
    this.writeScores(newScores);
  }
}
