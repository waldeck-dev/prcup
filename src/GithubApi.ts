import type { Issue, ItemType, Pull } from "./types.ts";
import { ItemTypeEnum } from "./types.ts";

export default class GithubApi {
  BASE_URL = new URL("https://api.github.com");

  owner: string;
  name: string;
  key: string;

  constructor(owner: string, name: string, key: string) {
    this.owner = owner;
    this.name = name;
    this.key = key;
  }

  getBaseUrl(): URL {
    return new URL(`repos/${this.owner}/${this.name}/`, this.BASE_URL);
  }

  getEndpointUrl(path: string, query?: Record<string, string>): URL {
    const url = new URL(path, this.getBaseUrl());
    url.search = new URLSearchParams(query).toString();
    return url;
  }

  getHeaders() {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${this.key}`,
    };
  }

  async parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 200) {
      return await response.json();
    }

    throw await new Error("Invalid response");
  }

  async getLatestItem(type: ItemType): Promise<number> {
    const route = {
      [ItemTypeEnum.PULL]: "pulls",
      [ItemTypeEnum.ISSUE]: "issues",
    }[type];

    const endpoint = this.getEndpointUrl(route, {
      sort: "created",
      direction: "desc",
      per_page: "1",
    });

    let latestItem = 0;

    try {
      const res = await fetch(endpoint, { headers: this.getHeaders() });
      const data = await this.parseResponse<{ number: number }[]>(res);
      latestItem = data[0].number;
    } catch (err) {
      console.error("Error while fetching: ", err);
    }

    return latestItem;
  }

  async getLatestPull(): Promise<number> {
    return await this.getLatestItem(ItemTypeEnum.PULL);
  }

  async getLatestIssue(): Promise<number> {
    return await this.getLatestItem(ItemTypeEnum.ISSUE);
  }

  async getItem<T>(number: number, type: ItemType): Promise<T> {
    const endpoint = {
      [ItemTypeEnum.PULL]: `pulls/${number}`,
      [ItemTypeEnum.ISSUE]: `issues/${number}`,
    }[type];

    const res = await fetch(this.getEndpointUrl(endpoint), {
      headers: this.getHeaders(),
    });

    return this.parseResponse<T>(res);
  }

  async getPull(number: number): Promise<Pull> {
    return await this.getItem<Pull>(number, ItemTypeEnum.PULL);
  }

  async getIssue(number: number): Promise<Issue> {
    return await this.getItem<Issue>(number, ItemTypeEnum.ISSUE);
  }
}
