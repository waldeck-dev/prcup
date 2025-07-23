export const ItemTypeEnum = {
  PULL: "pull",
  ISSUE: "issue",
} as const;

export type ItemType = typeof ItemTypeEnum[keyof typeof ItemTypeEnum];

export type Score = {
  number: number;
  type: ItemType;
  user: User;
  score: number;
  processed: boolean;
};

export type aUserScores = {
  // Score data ready to be processed by PageGenerator
  [position: number]: { user: User; scores: Score[] }[];
};

export type UserScores = Map<number, { user: User; scores: Score[] }[]>;

export type User = {
  avatar_url: string;
  html_url: string;
  login: string;
  status?: Status;
};

export type Pull = {
  type: typeof ItemTypeEnum.PULL;
  number: number;
  state: "open" | "closed";
  merged: boolean;
  assignee: User;
  user: User;
};

export type Issue = {
  type: typeof ItemTypeEnum.ISSUE;
  number: number;
  state: "open" | "closed";
  state_reason: "completed" | "duplicate" | "not_planned" | "reopened" | null;
  assignee: User;
  user: User;
};

export type Status = "active" | "inactive";
