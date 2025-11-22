import { PerformanceFeedbackOutput } from '@/ai/flows/detailed-performance-feedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, MessageSquareQuote, ShieldHalf, Target, Trophy } from 'lucide-react';

interface FeedbackCardProps {
  feedback: PerformanceFeedbackOutput;
}

const FeedbackSection = ({ title, content, icon: Icon }: { title: string; content: string; icon: React.ElementType }) => (
  <div>
    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-primary-foreground">
      <Icon className="h-5 w-5 text-accent" />
      {title}
    </h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{content}</p>
  </div>
);

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <Card className="w-full shadow-2xl animate-fade-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl text-primary-foreground">
          <Trophy className="h-8 w-8 text-accent" />
          Interview Performance Review
        </CardTitle>
        <CardDescription>Here's a breakdown of your performance. Use this feedback to improve for your next interview!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FeedbackSection title="Overall Feedback" content={feedback.overallFeedback} icon={CheckCircle2} />
        <Separator />
        <FeedbackSection title="Communication Skills" content={feedback.communicationSkills} icon={MessageSquareQuote} />
        <Separator />
        <FeedbackSection title="Technical Knowledge" content={feedback.technicalKnowledge} icon={ShieldHalf} />
        <Separator />
        <FeedbackSection title="Areas for Improvement" content={feedback.areasForImprovement} icon={Target} />
      </CardContent>
    </Card>
  );
}
