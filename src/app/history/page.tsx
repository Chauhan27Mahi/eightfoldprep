'use client';

import useLocalStorage from '@/hooks/use-local-storage';
import type { InterviewSessionData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, History as HistoryIcon, Calendar } from 'lucide-react';

function HistoryPage() {
  const [sessions] = useLocalStorage<InterviewSessionData[]>('interviewHistory', []);

  const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <HistoryIcon className="h-8 w-8 text-accent" />
        <h1 className="text-3xl font-bold text-primary-foreground">Interview History</h1>
      </div>

      {sortedSessions.length === 0 ? (
        <Card className="text-center py-16">
          <CardHeader>
            <CardTitle>No interviews yet!</CardTitle>
            <CardDescription>Your past interview sessions will appear here once you've completed one.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Start Your First Interview</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedSessions.map((session) => (
            <Card key={session.id} className="hover:border-accent transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-xl text-primary-foreground">{session.jobRole}</CardTitle>
                <CardDescription className="flex items-center gap-2 pt-1">
                  <Calendar className="h-4 w-4"/>
                  {new Date(session.startTime).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {session.feedback?.overallFeedback || 'Feedback not available.'}
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/interview/${session.id}?role=${encodeURIComponent(session.jobRole)}`}>
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
