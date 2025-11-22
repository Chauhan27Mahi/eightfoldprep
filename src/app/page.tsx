'use client';

import { SpeakingPracticeClient } from '@/components/speaking-practice-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex justify-center items-start h-full pt-8">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary-foreground">Welcome to Ace The Interview</CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            Practice for your next big opportunity. Select a scenario below to start a mock interview with our AI agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpeakingPracticeClient />
        </CardContent>
      </Card>
    </div>
  );
}
