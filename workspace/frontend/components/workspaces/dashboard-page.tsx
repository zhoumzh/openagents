'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Bot, Clock, Loader2, LogOut, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useOpenAgentsAuth } from '@/lib/openagents-auth-context';
import { createWorkspace, listMyWorkspaces, type WorkspaceSummary } from '@/lib/dashboard-api';
import { timeAgo } from '@/lib/helpers';

const LOCAL_WORKSPACES_KEY = 'oa_local_workspaces';

function readLocalWorkspaces(): WorkspaceSummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_WORKSPACES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rememberLocalWorkspace(workspace: WorkspaceSummary) {
  if (typeof window === 'undefined') return;
  const existing = readLocalWorkspaces();
  const next = [
    workspace,
    ...existing.filter((item) => item.workspaceId !== workspace.workspaceId),
  ];
  localStorage.setItem(LOCAL_WORKSPACES_KEY, JSON.stringify(next.slice(0, 50)));
}

function CreateWorkspaceForm({
  creatorEmail,
  bearerToken,
  onCreated,
  onCancel,
}: {
  creatorEmail?: string | null;
  bearerToken?: string | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [agentName, setAgentName] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedAgentName = agentName.trim();
    if (!trimmedName) return;
    setError('');
    setLoading(true);
    try {
      const ws = await createWorkspace({
        agentName: trimmedAgentName || undefined,
        name: trimmedName,
        creatorEmail,
        bearerToken,
      });
      rememberLocalWorkspace({
        workspaceId: ws.workspaceId,
        slug: ws.slug,
        name: ws.name,
        status: 'active',
        token: ws.token,
        agentCount: trimmedAgentName ? 1 : 0,
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      });
      onCreated();
      router.push(ws.token ? `/${ws.slug}?token=${ws.token}` : `/${ws.slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '创建工作区失败');
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <h3 className="font-medium text-sm">新建工作区</h3>
          <div className="space-y-2">
            <Input
              placeholder="工作区名称（必填）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <Input
              placeholder="智能体名称（选填）"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="size-3 animate-spin mr-1" /> : <Plus className="size-3 mr-1" />}
              创建
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function WorkspaceCard({ workspace }: { workspace: WorkspaceSummary }) {
  const router = useRouter();
  const targetUrl = workspace.token ? `/${workspace.slug}?token=${workspace.token}` : `/${workspace.slug}`;

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/30 hover:bg-accent/5"
      onClick={() => router.push(targetUrl)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium truncate">{workspace.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{workspace.slug}</p>
          </div>
          <Badge variant={workspace.status === 'active' ? 'primary' : 'secondary'} className="shrink-0 text-xs">
            {workspace.status === 'archived' && <Archive className="size-3 mr-1" />}
            {workspace.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {workspace.agentCount} 个智能体
          </span>
          {workspace.lastActivityAt && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {timeAgo(workspace.lastActivityAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              router.push(targetUrl);
            }}
          >
            打开
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkspaceDashboardPage() {
  const legacyAuth = useAuth();
  const openAgentsAuth = useOpenAgentsAuth();
  const user = openAgentsAuth.user || legacyAuth.user;
  const bearerToken = openAgentsAuth.idToken;
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const handleLogout = useCallback(async () => {
    if (openAgentsAuth.user) {
      await openAgentsAuth.signOut();
      return;
    }
    legacyAuth.logout();
  }, [legacyAuth, openAgentsAuth]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!user?.email) {
        setWorkspaces(readLocalWorkspaces());
      } else {
        const data = await listMyWorkspaces({
          creatorEmail: user.email,
          bearerToken,
        });
        setWorkspaces(data.items);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载工作区失败');
    } finally {
      setLoading(false);
    }
  }, [bearerToken, user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClearLocalWorkspaces = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_WORKSPACES_KEY);
    }
    setWorkspaces([]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="size-5 text-primary" />
            <h1 className="font-semibold">我的工作区</h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
                  <LogOut className="size-4" />
                </Button>
              </>
            ) : (
              <Badge variant="secondary">Public Access</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">
              {loading ? '加载中...' : `${workspaces.length} 个工作区`}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              未登录时仅显示本浏览器创建过的 workspace。
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!user?.email && workspaces.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearLocalWorkspaces}>
                <Trash2 className="size-4 mr-1" />
                清除本地记录
              </Button>
            )}
            {!showCreate && (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="size-4 mr-1" />
                新建工作区
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {showCreate && (
          <div className="mb-6">
            <CreateWorkspaceForm
              creatorEmail={openAgentsAuth.user?.email}
              bearerToken={bearerToken}
              onCreated={() => {
                setShowCreate(false);
                load();
              }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Bot className="size-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">暂无工作区</p>
            <p className="text-sm text-muted-foreground/70">
              点击新建，或通过命令行 (CLI) 认领匿名工作区
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <WorkspaceCard key={ws.workspaceId} workspace={ws} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
