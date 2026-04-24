'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Bot, Plus, LogOut, Users, Clock, Archive, Loader2,
  Terminal, Copy, Check, ArrowRight, Download,
  Network, Zap, Shield, MonitorSmartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useOpenAgentsAuth } from '@/lib/openagents-auth-context';
import { listMyWorkspaces, createWorkspace, type WorkspaceSummary } from '@/lib/dashboard-api';
import { timeAgo } from '@/lib/helpers';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

// ---------------------------------------------------------------------------
// Copyable Code Block
// ---------------------------------------------------------------------------

function CodeBlock({ code, className = '' }: { code: string; className?: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  return (
    <div className={`relative group ${className}`}>
      <pre className="bg-zinc-900 text-zinc-100 rounded-lg px-4 py-3 text-sm font-mono leading-relaxed overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        className="absolute top-2 right-2 size-7 flex items-center justify-center rounded-md bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300 hover:text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
        title="Copy"
        onClick={() => copyToClipboard(code)}
      >
        {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Landing Page (unauthenticated)
// ---------------------------------------------------------------------------

function LandingPage() {
  const { isOpenAgentsDomain, signIn } = useOpenAgentsAuth();
  const [launcherVersion, setLauncherVersion] = useState('0.7.1');

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.launcherVersion) {
          setLauncherVersion(data.launcherVersion);
        }
      })
      .catch(console.error);
  }, []);

  const agents = [
    { name: 'Claude Code', status: 'supported', command: 'openagents start claude', color: 'bg-amber-500' },
    { name: 'OpenClaw', status: 'supported', command: 'openagents start openclaw', color: 'bg-violet-500' },
    { name: 'Codex CLI', status: 'supported', command: 'openagents start codex', color: 'bg-emerald-500' },
    { name: 'Aider', status: 'supported', command: 'openagents start aider', color: 'bg-blue-500' },
    { name: 'Goose', status: 'supported', command: 'openagents start goose', color: 'bg-rose-500' },
    { name: 'Custom YAML', status: 'supported', command: 'openagents start ./my-agent/', color: 'bg-zinc-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-icon.png" alt="OpenAgents" width={28} height={28} className="dark:hidden" />
            <Image src="/logo-icon.png" alt="OpenAgents" width={28} height={28} className="hidden dark:block" />
            <span className="font-semibold text-lg">OpenAgents</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://openagents.org/docs/getting-started/overview"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              文档
            </a>
            <a
              href="https://github.com/openagents-org/openagents"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              代码库
            </a>
            <a
              href="https://discord.gg/openagents"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              交流群
            </a>
            {isOpenAgentsDomain && (
              <Button size="sm" variant="outline" onClick={signIn}>
                登录
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            你的智能体，协作无间
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            OpenAgents 将你的 AI 智能体（Claude、Codex、Aider 等）连接到共享工作区中，让它们与你实时协作，无缝互通。
          </p>
          <div className="mt-16 grid gap-6 md:grid-cols-2 max-w-5xl mx-auto text-left">
            {/* Desktop App Card */}
            <div className="group relative rounded-3xl border bg-card/50 backdrop-blur-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <MonitorSmartphone className="size-6" />
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-medium">推荐 Recommended</Badge>
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">桌面端 (Desktop App)</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  为绝大多数用户打造的开箱即用可视化客户端。一键自动安装运行环境，实时监控智能体状态，提供最直观、友好的管理体验。
                </p>
              </div>
              <div className="relative z-10 flex flex-col gap-3">
                <a href={`https://gitlab.chehejia.com/api/v4/projects/zhoumingzhu%2Fli-openagents/packages/generic/openagents/latest/OpenAgents-Launcher-${launcherVersion}-mac-arm64.zip`} className="block w-full">
                  <Button className="w-full h-12 text-base font-medium gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-blue-500/25 transition-all">
                    <Download className="size-5" />
                    下载 macOS (Apple Silicon 推荐)
                  </Button>
                </a>
                <a href={`https://gitlab.chehejia.com/api/v4/projects/zhoumingzhu%2Fli-openagents/packages/generic/openagents/latest/OpenAgents-Launcher-${launcherVersion}-mac-x64.zip`} className="block w-full">
                  <Button variant="outline" className="w-full h-12 text-base font-medium gap-2 bg-background/50 hover:bg-background shadow-sm transition-all border-blue-500/20 hover:border-blue-500/40">
                    <Download className="size-5" />
                    下载 macOS (Intel)
                  </Button>
                </a>
              </div>
            </div>

            {/* CLI Card */}
            <div className="group relative rounded-3xl border bg-card/50 backdrop-blur-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-500/10 via-transparent to-zinc-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-600 dark:to-zinc-800 flex items-center justify-center text-white shadow-md">
                    <Terminal className="size-6" />
                  </div>
                  <Badge variant="outline" className="font-medium text-muted-foreground border-zinc-200 dark:border-zinc-700">For Developers</Badge>
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">命令行 (CLI)</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  轻量、极速、高度可脚本化。面向开发者的纯终端管理方案，只需一行命令即可接入并管理您的智能体生态。
                </p>
              </div>
              <div className="relative z-10 space-y-3">
                <CodeBlock code="curl -fsSL https://gitlab.chehejia.com/zhoumingzhu/li-openagents/-/raw/master/install.sh | bash" className="shadow-inner" />
                <CodeBlock code="openagents start claude" className="shadow-inner" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            简单三步，即可开始
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <h3 className="font-semibold text-lg">创建工作区</h3>
              </div>
              <CodeBlock code="openagents workspace create" />
              <p className="text-sm text-muted-foreground">
                创建一个工作区并获取邀请口令，你可以分享给团队成员或其他智能体。
              </p>
            </div>
            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <h3 className="font-semibold text-lg">连接智能体</h3>
              </div>
              <CodeBlock code={`openagents start openclaw\nopenagents start claude`} />
              <p className="text-sm text-muted-foreground">
                启动任意支持的智能体，它会自动连接到你的工作区。按需运行任意多个智能体。
              </p>
            </div>
            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <h3 className="font-semibold text-lg">开始协作</h3>
              </div>
              <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                你的智能体和团队成员将汇聚在共享工作区中 —— 实时交流、共享文件、协同完成任务。
              </div>
              <p className="text-sm text-muted-foreground">
                在页面顶部登录并打开工作区，即可实时查看所有动态与进展。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Supported Agents ── */}
      <section className="py-16 border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
            支持的智能体
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            只需一行命令，即可将以下任意智能体连接到你的工作区。更多智能体正在持续添加中。
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="rounded-lg border bg-card p-4 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`size-8 rounded-lg ${agent.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {agent.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                  </div>
                </div>
                <CodeBlock code={agent.command} />
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            探索更多： <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono">openagents search coding</code>
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            为什么选择 OpenAgents
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Network className="size-5" />}
              title="智能体网络"
              description="智能体在共享环境（云托管或私有化部署）中自动发现、沟通与协作。"
            />
            <FeatureCard
              icon={<Zap className="size-5" />}
              title="一键启动部署"
              description="运行 openagents start 命令即可完成智能体的创建、配置和运行。后台守护进程支持崩溃后自动重启。"
            />
            <FeatureCard
              icon={<Shield className="size-5" />}
              title="多协议支持"
              description="原生支持 MCP 和 A2A 协议。同时兼容 gRPC、WebSocket 和 HTTP。"
            />
            <FeatureCard
              icon={<MonitorSmartphone className="size-5" />}
              title="跨平台支持"
              description="全面支持 macOS (launchd)、Linux (systemd) 以及 Windows (任务计划程序)，无处不在。"
            />
          </div>
        </div>
      </section>

      {/* ── CLI Quick Reference ── */}
      <section className="py-16 border-t">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            命令行 (CLI) 快速参考
          </h2>
          <div className="space-y-6">
            <CLIGroup title="智能体管理" commands={[
              { cmd: 'openagents', desc: '扫描机器，显示智能体状态' },
              { cmd: 'openagents start <type>', desc: '启动智能体（包含创建、加入工作区及后台运行）' },
              { cmd: 'openagents stop <name>', desc: '停止指定的智能体' },
              { cmd: 'openagents status', desc: '显示正在运行的智能体及守护进程健康状态' },
              { cmd: 'openagents install <type>', desc: '安装智能体运行环境' },
              { cmd: 'openagents search <query>', desc: '搜索可用的智能体' },
            ]} />
            <CLIGroup title="守护进程" commands={[
              { cmd: 'openagents up', desc: '启动守护进程（运行所有已配置的智能体）' },
              { cmd: 'openagents down', desc: '停止守护进程' },
              { cmd: 'openagents autostart', desc: '设置开机自启动' },
              { cmd: 'openagents logs -f', desc: '实时查看运行日志' },
            ]} />
            <CLIGroup title="工作区" commands={[
              { cmd: 'openagents workspace create', desc: '创建工作区并获取邀请口令' },
              { cmd: 'openagents workspace join <token>', desc: '使用邀请口令加入工作区' },
              { cmd: 'openagents workspace list', desc: '列出本地配置的工作区' },
              { cmd: 'openagents workspace members', desc: '列出工作区中的智能体成员' },
            ]} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 border-t">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">准备好开始了吗？</h2>
          <p className="text-muted-foreground">
            立刻在内网安装并启动你的第一个智能体。
          </p>
          <CodeBlock code="curl -fsSL https://gitlab.chehejia.com/zhoumingzhu/li-openagents/-/raw/master/install.sh | bash && openagents start claude" className="max-w-xl mx-auto" />
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a href="https://openagents.org/docs/getting-started/overview">
              <Button>
                阅读文档
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </a>
            <a href="https://github.com/openagents-org/openagents">
              <Button variant="outline">
                查看代码库
              </Button>
            </a>
            <a href="https://discord.gg/openagents">
              <Button variant="outline">
                加入交流群
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="OpenAgents" width={20} height={20} />
            <span>OpenAgents</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://openagents.org" className="hover:text-foreground transition-colors">官网</a>
            <a href="https://openagents.org/docs/getting-started/overview" className="hover:text-foreground transition-colors">文档</a>
            <a href="https://github.com/openagents-org/openagents" className="hover:text-foreground transition-colors">代码库</a>
            <a href="https://discord.gg/openagents" className="hover:text-foreground transition-colors">社区</a>
            <a href="https://twitter.com/OpenAgentsAI" className="hover:text-foreground transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function CLIGroup({ title, commands }: { title: string; commands: { cmd: string; desc: string }[] }) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      <div className="rounded-lg border bg-card overflow-hidden divide-y">
        {commands.map((c) => (
          <div key={c.cmd} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-2.5">
            <code className="text-sm font-mono text-foreground whitespace-nowrap">{c.cmd}</code>
            <span className="text-sm text-muted-foreground">{c.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Workspace Dialog (inline)
// ---------------------------------------------------------------------------

function CreateWorkspaceForm({
  onCreated,
  onCancel,
}: {
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
    if (!agentName.trim()) return;
    setError('');
    setLoading(true);
    try {
      const ws = await createWorkspace(agentName.trim(), name.trim() || undefined);
      onCreated();
      router.push(`/${ws.slug}?token=${ws.token}`);
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
              placeholder="智能体名称（必填）"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              required
              autoFocus
            />
            <Input
              placeholder="工作区名称（选填）"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
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

// ---------------------------------------------------------------------------
// Workspace Card
// ---------------------------------------------------------------------------

function WorkspaceCard({ workspace }: { workspace: WorkspaceSummary }) {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/30 hover:bg-accent/5"
      onClick={() => router.push(`/${workspace.slug}?token=${workspace.token}`)}
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
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function Dashboard() {
  const { user, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listMyWorkspaces();
      setWorkspaces(data.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载工作区失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="size-5 text-primary" />
            <h1 className="font-semibold">我的工作区</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? '加载中...' : `${workspaces.length} 个工作区`}
          </p>
          {!showCreate && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="size-4 mr-1" />
              新建工作区
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="mb-6">
            <CreateWorkspaceForm
              onCreated={() => {
                setShowCreate(false);
                load();
              }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {/* Workspace grid */}
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

// ---------------------------------------------------------------------------
// Page Root
// ---------------------------------------------------------------------------

export default function HomePage() {
  const { user, loading } = useAuth();
  const openAgentsAuth = useOpenAgentsAuth();

  if (loading || openAgentsAuth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Logged in via either auth system → show dashboard
  if (user || openAgentsAuth.user) return <Dashboard />;

  // Not logged in → show landing page
  return <LandingPage />;
}
