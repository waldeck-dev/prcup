export const ItemTypeEnum = {
  PULL: "pull",
  ISSUE: "issue",
} as const;

export type ItemType = typeof ItemTypeEnum[keyof typeof ItemTypeEnum];

export type Score = {
  number: number;
  type: ItemType;
  user: User;
  state: Pull["merged"] | Issue["state_reason"];
  score: number;
};

export type User = {
  avatar_url: string;
  html_url: string;
  login: string;
};

export type Pull = {
  type: typeof ItemTypeEnum.PULL;
  number: number;
  merged: boolean;
  user: User;
};

export type Issue = {
  type: typeof ItemTypeEnum.ISSUE;
  number: number;
  state_reason: "not_planned" | "completed" | null;
  assignee: User;
  user: User;
};
