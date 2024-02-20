export type User = {
  avatar_url: string;
  html_url: string;
  login: string;
};

export type Pull = {
  number: number;
  merged: boolean;
  user: User;
};

export type Issue = {
  number: number;
  state_reason: "not_planned" | "completed" | null;
  assignee: User;
  user: User;
};

export const ItemTypeEnum = {
  PULL: "pull",
  ISSUE: "issue",
} as const;

export type ItemType = typeof ItemTypeEnum[keyof typeof ItemTypeEnum];
