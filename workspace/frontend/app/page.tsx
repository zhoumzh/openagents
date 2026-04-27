'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Terminal, Copy, Check, ArrowRight,
  Network, Zap, Shield, MonitorSmartphone, LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

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

export default function HomePage() {
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
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-icon.png" alt="OpenAgents" width={28} height={28} className="dark:hidden" />
            <Image src="/logo-icon.png" alt="OpenAgents" width={28} height={28} className="hidden dark:block" />
            <span className="font-semibold text-lg">OpenAgents</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <LayoutGrid className="size-4" />
              进入工作区
            </Link>
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
          </div>
        </div>
      </header>

      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            让你的智能体，协作无间
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            OpenAgents 将你的 AI 智能体（Claude、CodexCli、geminiCLI 等）连接到共享工作区中，让它们与你实时协作，无缝互通。
          </p>
          <div className="mt-16 max-w-2xl mx-auto text-left">
            <div className="group relative rounded-3xl border bg-card/50 backdrop-blur-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Terminal className="size-6" />
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-medium">一键安装</Badge>
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">OpenAgents 全家桶</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  只需执行下方的一行命令，即可同时安装底层的 CLI 管理工具和极速轻量的桌面可视化界面 (GUI)。
                </p>
              </div>
              <div className="relative z-10 space-y-4">
                <CodeBlock code="curl -fsSL https://gitlab.chehejia.com/zhoumingzhu/li-openagents/-/raw/master/install.sh | bash" className="shadow-inner" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded border bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">启动可视化界面</p>
                    <code className="text-sm font-mono font-medium">openagentsui</code>
                  </div>
                  <div className="rounded border bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">命令行启动智能体</p>
                    <code className="text-sm font-mono font-medium">openagents start claude</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            简单三步，即可开始
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
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
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <h3 className="font-semibold text-lg">开始协作</h3>
              </div>
              <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                你的智能体和团队成员将汇聚在共享工作区中 —— 实时交流、共享文件、协同完成任务。
              </div>
              <p className="text-sm text-muted-foreground">
                也可以直接从页面顶部的“进入工作区”入口访问 `/workspaces`。
              </p>
            </div>
          </div>
        </div>
      </section>

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

      <section className="py-16 border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">CLI 快速参考</h2>
            <p className="text-muted-foreground">
              当前版本：<code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono">{launcherVersion}</code>
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <CLIGroup
              title="Workspace"
              commands={[
                { cmd: 'openagents workspace create', desc: '创建新的工作区' },
                { cmd: 'openagents workspace list', desc: '列出所有工作区' },
                { cmd: 'openagents workspace join <token>', desc: '通过 token 加入工作区' },
              ]}
            />
            <CLIGroup
              title="Agents"
              commands={[
                { cmd: 'openagents start claude', desc: '启动 Claude Code 智能体' },
                { cmd: 'openagents start codex', desc: '启动 Codex CLI 智能体' },
                { cmd: 'openagents start openclaw', desc: '启动 OpenClaw 智能体' },
              ]}
            />
          </div>
          <div className="flex justify-center">
            <Link href="/workspaces">
              <Button size="lg">
                立即进入工作区
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="OpenAgents" width={20} height={20} />
            <span>OpenAgents</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/workspaces" className="hover:text-foreground transition-colors">Workspace</Link>
            <a href="https://openagents.org" className="hover:text-foreground transition-colors">官网</a>
            <a href="https://openagents.org/docs/getting-started/overview" className="hover:text-foreground transition-colors">文档</a>
            <a href="https://github.com/openagents-org/openagents" className="hover:text-foreground transition-colors">代码库</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
