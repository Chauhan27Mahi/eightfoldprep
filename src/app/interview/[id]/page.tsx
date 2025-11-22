
'use client';

import { InterviewSession } from '@/components/interview-session';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// React.use is not available in this version of React, so we avoid it.
function InterviewPageContent({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const jobRole = searchParams.get('role') || 'a job';

  return <InterviewSession interviewId={params.id} jobRole={jobRole} />;
}


export default function InterviewPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InterviewPageContent params={params} />
    </Suspense>
  )
}
