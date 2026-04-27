import { getStoredAuth, refreshAccessToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://openagents-test.inner.chj.cloud';

type AuthOptions = {
  bearerToken?: string | null;
  workspaceToken?: string | null;
};

export interface WorkspaceSummary {
  workspaceId: string;
  slug: string;
  name: string;
  status: string;
  token: string | null;
  agentCount: number;
  createdAt: string | null;
  lastActivityAt: string | null;
}

export interface PaginatedWorkspaces {
  items: WorkspaceSummary[];
  pagination: {
    page: number;
    page_size: number;
    total: number | null;
    total_pages: number | null;
    has_next: boolean;
    has_prev: boolean;
  };
}

type LegacyWorkspaceSummary = WorkspaceSummary;

type ModernWorkspaceSummary = {
  workspaceId: string;
  slug: string;
  name: string;
  status: string;
  createdAt: string | null;
  lastActivityAt: string | null;
  agents?: unknown[];
};

type ApiError = Error & { status?: number };

function createApiError(message: string, status?: number): ApiError {
  const error = new Error(message) as ApiError;
  if (status !== undefined) error.status = status;
  return error;
}

function buildHeaders(options: AuthOptions, includeJsonContentType = true): HeadersInit {
  const headers: Record<string, string> = {};

  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.workspaceToken) {
    headers['X-Workspace-Token'] = options.workspaceToken;
  }
  if (options.bearerToken) {
    headers.Authorization = `Bearer ${options.bearerToken}`;
  }

  return headers;
}

async function parseError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => null);
  return createApiError(
    body?.message || body?.detail || `API error (${res.status})`,
    res.status,
  );
}

async function modernFetch<T>(
  path: string,
  options: RequestInit = {},
  auth: AuthOptions = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(auth),
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  const json = await res.json();
  return json.data as T;
}

async function legacyAuthFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = getStoredAuth();

  const doFetch = async (token: string) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

  if (!accessToken) {
    throw createApiError('Session expired', 401);
  }

  let res = await doFetch(accessToken);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) throw createApiError('Session expired', 401);
    res = await doFetch(newToken);
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  const json = await res.json();
  return json.data as T;
}

function isLegacyRouteMissing(error: unknown): boolean {
  return !!(error && typeof error === 'object' && 'status' in error && (
    (error as ApiError).status === 404 || (error as ApiError).status === 405
  ));
}

function mapModernWorkspace(item: ModernWorkspaceSummary): WorkspaceSummary {
  return {
    workspaceId: item.workspaceId,
    slug: item.slug,
    name: item.name,
    status: item.status,
    token: null,
    agentCount: item.agents?.length || 0,
    createdAt: item.createdAt,
    lastActivityAt: item.lastActivityAt,
  };
}

export async function listMyWorkspaces({
  creatorEmail,
  page = 1,
  pageSize = 50,
  status,
  bearerToken,
}: {
  creatorEmail?: string | null;
  page?: number;
  pageSize?: number;
  status?: string;
  bearerToken?: string | null;
}): Promise<PaginatedWorkspaces> {
  if (!creatorEmail) {
    return {
      items: [],
      pagination: {
        page,
        page_size: pageSize,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }

  try {
    const params = new URLSearchParams({ creator_email: creatorEmail });

    const query = params.toString();
    const items = await modernFetch<ModernWorkspaceSummary[]>(
      `/v1/workspaces${query ? `?${query}` : ''}`,
      {},
      { bearerToken },
    );

    const mapped = items
      .filter((item) => !status || item.status === status)
      .map(mapModernWorkspace);
    const total = mapped.length;
    const start = Math.max((page - 1) * pageSize, 0);
    const pageItems = mapped.slice(start, start + pageSize);
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      items: pageItems,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPages,
        has_next: start + pageSize < total,
        has_prev: page > 1,
      },
    };
  } catch (error) {
    if (!isLegacyRouteMissing(error)) {
      throw error;
    }
  }

  const legacy = await legacyAuthFetch<PaginatedWorkspaces>(
    `/v1/ws?page=${page}&page_size=${pageSize}${status ? `&status=${status}` : ''}`,
  );
  return legacy;
}

export async function createWorkspace({
  agentName,
  name,
  creatorEmail,
  bearerToken,
}: {
  agentName?: string;
  name: string;
  creatorEmail?: string | null;
  bearerToken?: string | null;
}): Promise<{
  workspaceId: string;
  slug: string;
  name: string;
  token: string | null;
  url?: string;
}> {
  const workspaceName = name.trim();
  const trimmedAgentName = agentName?.trim() || undefined;

  try {
    return await modernFetch<{
      workspaceId: string;
      slug: string;
      name: string;
      token: string;
    }>(
      '/v1/workspaces',
      {
        method: 'POST',
        body: JSON.stringify({
          name: workspaceName,
          agent_name: trimmedAgentName,
          creator_email: creatorEmail || undefined,
        }),
      },
      { bearerToken },
    );
  } catch (error) {
    if (!isLegacyRouteMissing(error)) {
      throw error;
    }

    return legacyAuthFetch('/v1/ws', {
      method: 'POST',
      body: JSON.stringify({
        agent_name: trimmedAgentName,
        name: workspaceName,
      }),
    });
  }
}
