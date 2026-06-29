"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  title?: string;
  className?: string;
}

export function CodeBlock({ code, language = "python", filename, title, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative group rounded-xl border border-border bg-zinc-950 text-zinc-100 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          {title && (
            <span className="text-xs font-medium text-zinc-400">{title}</span>
          )}
          {filename && (
            <span className="text-xs font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded">
              {filename}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* Code Content */}
      <div className="overflow-x-auto p-4">
        <pre className="text-sm leading-relaxed">
          <code className="font-mono">{code}</code>
        </pre>
      </div>
    </div>
  );
}

interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code className={cn(
      "px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 text-sm font-mono border border-zinc-200 dark:border-zinc-700",
      className
    )}>
      {children}
    </code>
  );
}