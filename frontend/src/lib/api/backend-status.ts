export interface BackendStatus {
  status: "UP";
  service: string;
  checkedAt: string;
}

export async function getBackendStatus(
  signal?: AbortSignal,
): Promise<BackendStatus> {
  const response = await fetch("/api/backend/status", {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Backend status request failed (${response.status})`);
  }

  const payload: unknown = await response.json();

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("status" in payload) ||
    payload.status !== "UP" ||
    !("service" in payload) ||
    typeof payload.service !== "string" ||
    !("checkedAt" in payload) ||
    typeof payload.checkedAt !== "string"
  ) {
    throw new Error("Backend returned an invalid status response");
  }

  return {
    status: payload.status,
    service: payload.service,
    checkedAt: payload.checkedAt,
  };
}
