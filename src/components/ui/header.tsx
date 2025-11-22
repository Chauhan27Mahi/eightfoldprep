"use client";

import Link from 'next/link';
import { Bot, History } from 'lucide-react';
import { Button } from './button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <Bot className="h-8 w-8 text-accent group-hover:animate-pulse" />
            <h1 className="text-xl font-bold tracking-tighter text-foreground">
              Ace The Interview
            </h1>
          </Link>

          <nav className="flex items-center gap-2">
            <Button asChild variant={pathname === '/' ? 'secondary' : 'ghost'} size="sm">
              <Link href="/">
                New Interview
              </Link>
            </Button>
            <Button asChild variant={pathname === '/history' ? 'secondary' : 'ghost'} size="sm">
              <Link href="/history">
                <History className="h-4 w-4 mr-2" />
                History
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
