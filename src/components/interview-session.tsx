'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import useSpeechRecognition from '@/hooks/use-speech-recognition';
import useLocalStorage from '@/hooks/use-local-storage';
import { generateFirstQuestion, generateFollowUp, getFeedback, getAudio } from '@/lib/actions';
import type { ChatMessage, InterviewSessionData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, MicOff, Send, Square } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { FeedbackCard } from './feedback-card';
import { Message } from './message';

const MAX_QUESTIONS = 5;

export function InterviewSession({ interviewId, jobRole }: { interviewId: string; jobRole: string }) {
  const { toast } = useToast();
  const [sessions, setSessions] = useLocalStorage<InterviewSessionData[]>('interviewHistory', []);
  
  const [currentSession, setCurrentSession] = useState<InterviewSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedFirstQuestion = useRef(false);

  const { isListening, transcript, startListening, stopListening, isSupported, error: speechError } = useSpeechRecognition();

  useEffect(() => {
    if (speechError) {
      toast({ variant: 'destructive', title: 'Speech Recognition Error', description: speechError });
    }
  }, [speechError, toast]);
  
  useEffect(() => {
    setUserAnswer(transcript);
  }, [transcript]);

  const playAudio = useCallback(async (text: string) => {
    try {
      // Add a small delay to ensure the document is considered "interacted with" if the user navigates quickly.
      // This is a pragmatic workaround for some browser autoplay policies.
      await new Promise(resolve => setTimeout(resolve, 50)); 
      const response = await getAudio(text);
      if (response.success && response.audioData) {
        if (audioRef.current) {
          audioRef.current.src = response.audioData;
          audioRef.current.play().catch(e => {
            console.error("Audio play failed", e);
            toast({ variant: 'destructive', title: 'Audio Playback Failed', description: "Could not play audio. Please ensure your browser allows autoplay."});
          });
        }
      } else {
        throw new Error(response.error || 'Failed to get audio');
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred';
      toast({ variant: 'destructive', title: 'Text-to-Speech Error', description: error });
    }
  }, [toast]);
  
  useEffect(() => {
    const initializeInterview = async () => {
        const existingSession = sessions.find(s => s.id === interviewId);
        if (existingSession) {
            setCurrentSession(existingSession);
            setIsLoading(false);
            return;
        }

        const response = await generateFirstQuestion(jobRole);
        if (response.success && response.question) {
            const firstMessage: ChatMessage = { role: 'ai', text: response.question };
            const newSession: InterviewSessionData = {
                id: interviewId,
                jobRole,
                messages: [firstMessage],
                startTime: Date.now(),
            };
            setCurrentSession(newSession);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: response.error });
        }
        setIsLoading(false);
    };

    initializeInterview();
    audioRef.current = new Audio();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId, jobRole]);
  
  useEffect(() => {
      if (currentSession && currentSession.messages.length > 0 && !hasPlayedFirstQuestion.current && !isLoading) {
          const firstQuestion = currentSession.messages[0].text;
          if (firstQuestion) {
              playAudio(firstQuestion);
              hasPlayedFirstQuestion.current = true;
          }
      }
  }, [currentSession, isLoading, playAudio]);


  const updateSession = (updatedSession: InterviewSessionData) => {
    setCurrentSession(updatedSession);
    setSessions(prev => {
        const index = prev.findIndex(s => s.id === updatedSession.id);
        if (index > -1) {
            const newSessions = [...prev];
            newSessions[index] = updatedSession;
            return newSessions;
        }
        return [...prev, updatedSession];
    });
  }

  const handleSendAnswer = async () => {
    if (!userAnswer.trim() || !currentSession) return;
    setIsLoading(true);

    const newMessages: ChatMessage[] = [...currentSession.messages, { role: 'user', text: userAnswer }];
    updateSession({ ...currentSession, messages: newMessages });
    setUserAnswer('');

    const aiMessages = newMessages.filter(m => m.role === 'ai');
    
    if (aiMessages.length >= MAX_QUESTIONS) {
      await handleFinishInterview(newMessages);
      return;
    }

    const previousQuestion = newMessages[newMessages.length - 2].text;
    const interviewTranscript = newMessages.map(m => `${m.role}: ${m.text}`).join('\n');
    
    const response = await generateFollowUp({ jobRole, previousQuestion, userResponse: userAnswer, interviewTranscript });

    if (response.success && response.question) {
      const nextQuestionMessage: ChatMessage = { role: 'ai', text: response.question };
      updateSession({ ...currentSession, messages: [...newMessages, nextQuestionMessage] });
      playAudio(response.question);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: response.error });
    }
    setIsLoading(false);
  };
  
  const handleFinishInterview = async (finalMessages: ChatMessage[]) => {
    if (!currentSession) return;
    setIsFinishing(true);
    setIsLoading(true);

    const interviewTranscript = finalMessages.map(m => `${m.role}: ${m.text}`).join('\n');
    const feedbackResponse = await getFeedback({ interviewTranscript, jobDescription: jobRole });

    if (feedbackResponse.success && feedbackResponse.feedback) {
      const finalSession = { ...currentSession, messages: finalMessages, feedback: feedbackResponse.feedback, endTime: Date.now() };
      updateSession(finalSession);
    } else {
      toast({ variant: 'destructive', title: 'Feedback Error', description: feedbackResponse.error });
      const finalSession = { ...currentSession, messages: finalMessages, endTime: Date.now() };
      updateSession(finalSession);
    }
    setIsLoading(false);
    setIsFinishing(false);
  };

  const questionCount = currentSession?.messages.filter(m => m.role === 'ai').length || 0;
  const progress = (questionCount / MAX_QUESTIONS) * 100;
  
  if (isLoading && !currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="ml-4 text-lg">Initializing your interview...</p>
      </div>
    );
  }
  
  if (currentSession?.feedback) {
    return <FeedbackCard feedback={currentSession.feedback} />;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto flex flex-col h-[calc(100vh-12rem)] shadow-2xl">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-primary-foreground">Interview for {jobRole}</CardTitle>
            <div className="text-right">
                <p className="text-sm font-medium text-accent">{`Question ${questionCount} of ${MAX_QUESTIONS}`}</p>
                <Progress value={progress} className="w-32 mt-1 h-2" />
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto pr-4 space-y-4">
        {currentSession?.messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        {isLoading && !isFinishing && (
          <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm text-muted-foreground">AI is thinking...</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t flex-col items-start gap-4">
        <div className="w-full relative">
            <Textarea
                placeholder={isListening ? 'Listening...' : 'Type your answer or use the microphone...'}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={4}
                className="pr-24"
                disabled={isLoading}
            />
            <Button 
                size="icon" 
                variant={isListening ? 'destructive' : 'outline'}
                onClick={isListening ? stopListening : startListening}
                disabled={!isSupported || isLoading}
                className="absolute right-12 bottom-2 h-8 w-8"
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
                {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
                size="icon"
                onClick={handleSendAnswer}
                disabled={isLoading || !userAnswer.trim()}
                className="absolute right-2 bottom-2 h-8 w-8"
                aria-label="Send answer"
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
        
        {currentSession && questionCount >= MAX_QUESTIONS && !isFinishing && (
          <Button onClick={() => handleFinishInterview(currentSession.messages)} className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
            Finish Interview & Get Feedback
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
