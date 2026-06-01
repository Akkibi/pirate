let requestedTreasureCardInstanceId: string | number | null = null;

export function requestTreasureCardSelection(instanceId: string | number): void {
  requestedTreasureCardInstanceId = instanceId;
}

export function consumeRequestedTreasureCardSelection(): string | number | null {
  const instanceId = requestedTreasureCardInstanceId;

  requestedTreasureCardInstanceId = null;

  return instanceId;
}

export function hasRequestedTreasureCardSelection(): boolean {
  return requestedTreasureCardInstanceId !== null;
}

export function clearRequestedTreasureCardSelection(): void {
  requestedTreasureCardInstanceId = null;
}
