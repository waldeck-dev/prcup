export class InvalidItemError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "InvalidItemError";
  }
}

export class ItemNotFoundError extends Error {
  constructor(number: number) {
    super(`Unable to find pull/issue #${number}`);
    this.name = "ItemNotFoundError";
  }
}
