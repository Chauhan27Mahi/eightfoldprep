import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message }: MessageProps) {
  const isAi = message.role === 'ai';

  return (
    <div className={cn('flex items-start gap-3', isAi ? 'justify-start' : 'justify-end')}>
      {isAi && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-md rounded-lg p-3 text-sm shadow-md',
          isAi ? 'bg-card text-card-foreground' : 'bg-primary text-primary-foreground'
        )}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
       {!isAi && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
