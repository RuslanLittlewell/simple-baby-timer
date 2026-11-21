export interface RemoteChange {
  type: 'live-changed';
  childId: string;
}

const asRemoteChange = (value: unknown): RemoteChange | null => {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<RemoteChange>;
  return item.type === 'live-changed' && typeof item.childId === 'string' && item.childId
    ? { type: item.type, childId: item.childId }
    : null;
};

export function parseRemoteChange(payload: unknown): RemoteChange | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const { body, dataString } = data as { body?: unknown; dataString?: unknown };
  const direct = asRemoteChange(body);
  if (direct || typeof dataString !== 'string') return direct;
  try {
    return asRemoteChange(JSON.parse(dataString));
  } catch {
    return null;
  }
}
