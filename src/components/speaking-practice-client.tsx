'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Mic, Square, Loader2, Play, Info, Hand, Send, Pause, Trophy } from 'lucide-react';
import { generateSpeakingPracticeResponse, PerformanceFeedback } from '@/ai/flows/generate-speaking-practice-response';
import { getAIErrorMessage } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

const VoiceOptions = z.enum(['Algenib', 'Charon', 'Kore', 'Zephyr']);
type VoiceOption = z.infer<typeof VoiceOptions>;


type Message = {
  role: 'user' | 'assistant';
  content: string; 
  audioUrl?: string; 
};

const scenarios = {
  "behavioral-interview": {
    title: "Behavioral Interview (HR)",
    description: "Practice answering questions about teamwork, leadership, and conflict resolution.",
    persona: "You are 'Alex', a friendly HR manager. Your goal is to assess the candidate's soft skills, cultural fit, and past behavior. Ask classic behavioral questions starting with 'Tell me about a time when...'.",
    needsTopic: true,
  },
  "technical-interview": {
    title: "Technical Interview",
    description: "Solve a technical problem and explain your thought process.",
    persona: "You are 'Sam', a senior engineer. Your goal is to assess the candidate's technical skills and problem-solving abilities. Present a technical problem or concept and discuss it with them.",
    needsTopic: true,
  },
  "random": {
      title: "Casual Chat",
      description: "A spontaneous chat about a random topic to warm up.",
      persona: "You are a curious and engaging conversationalist. The AI will invent a topic to start the conversation.",
      needsTopic: false,
  }
};

const voiceOptions: { name: VoiceOption, label: string }[] = [
    { name: 'Algenib', label: 'Male 1' },
    { name: 'Charon', label: 'Male 2' },
    { name: 'Kore', label: 'Female 1' },
    { name: 'Zephyr', label: 'Female 2' },
];

type ScenarioKey = keyof typeof scenarios;

type ScenarioSetupConfig = {
    scenario: ScenarioKey;
    topic: string;
    setting: 'Formal' | 'Informal';
    voice: VoiceOption;
};

const FeedbackSection = ({ title, content, icon: Icon }: { title: string; content: string; icon: React.ElementType }) => (
  <div>
    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-primary-foreground">
      <Icon className="h-5 w-5 text-accent" />
      {title}
    </h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{content}</p>
  </div>
);

const FeedbackDisplayModal = ({ feedback, onDone }: { feedback: PerformanceFeedback, onDone: () => void }) => {
    return (
        <Dialog open={true} onOpenChange={(open) => !open && onDone()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl text-primary-foreground">
                        <Trophy className="h-8 w-8 text-accent" />
                        Interview Performance Review
                    </DialogTitle>
                    <DialogDescription>Here is a breakdown of your performance.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-4">
                    <FeedbackSection title="Overall Summary" content={feedback.overallSummary} icon={Trophy} />
                    <Separator />
                    <FeedbackSection title="Clarity and Conciseness" content={feedback.clarity} icon={Info} />
                    <Separator />
                    <FeedbackSection title="Relevance to Prompt" content={feedback.relevance} icon={Hand} />
                    <Separator />
                    <FeedbackSection title="Problem Solving" content={feedback.problemSolving} icon={Hand} />
                </div>
                <DialogFooter>
                    <Button onClick={onDone}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const ScenarioSetupModal = ({ onStart }: { onStart: (config: ScenarioSetupConfig) => void }) => {
    const [step, setStep] = useState(1);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioKey | null>(null);
    const [topic, setTopic] = useState('');
    const [setting, setSetting] = useState<'Formal' | 'Informal'>('Formal');
    const [voice, setVoice] = useState<VoiceOption>('Algenib');
    
    if (!selectedScenario || step === 1) {
        return (
             <Card className="border-0 shadow-none">
                <CardHeader>
                    <CardTitle>Select an Interview Scenario</CardTitle>
                    <CardDescription>Choose a role-playing situation to practice.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="p-4 border rounded-md bg-muted/50 mb-4 space-y-2 text-sm text-muted-foreground">
                        <h4 className="font-semibold text-foreground flex items-center gap-2"><Info className="h-4 w-4" /> How This Works</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>After the AI speaks, press the "Record Answer" button to start speaking.</li>
                            <li>Press "Stop Recording" when you are finished.</li>
                            <li>The AI will then process your response and reply.</li>
                        </ul>
                    </div>

                    {Object.entries(scenarios).map(([key, value]) => (
                        <Button 
                            key={key} 
                            variant="outline" 
                            className="w-full justify-start h-auto py-3 whitespace-normal"
                            onClick={() => {
                                const scenarioKey = key as ScenarioKey;
                                setSelectedScenario(scenarioKey);
                                if (scenarios[scenarioKey].needsTopic) {
                                    setStep(2);
                                } else {
                                    setStep(3); // Go to voice selection
                                }
                            }}
                        >
                            <div className="text-left">
                                <p className="font-semibold">{value.title}</p>
                                <p className="text-xs text-muted-foreground">{value.description}</p>
                            </div>
                        </Button>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (step === 3) {
      return (
         <Dialog open={true} onOpenChange={(open) => !open && setStep(selectedScenario && scenarios[selectedScenario].needsTopic ? 2 : 1)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select a Voice</DialogTitle>
                    <DialogDescription>Choose the voice for your AI partner.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Label htmlFor="voice">AI Voice</Label>
                    <Select value={voice} onValueChange={(v) => setVoice(v as VoiceOption)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {voiceOptions.map(opt => <SelectItem key={opt.name} value={opt.name}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <DialogFooter>
                    <Button variant="ghost" onClick={() => setStep(selectedScenario && scenarios[selectedScenario].needsTopic ? 2 : 1)}>Back</Button>
                    <Button onClick={() => onStart({ scenario: selectedScenario, topic, setting, voice })}>Start Session</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      )
    }
    
    return (
        <Dialog open={true} onOpenChange={(open) => !open && setStep(1)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Scenario Setup</DialogTitle>
                    <DialogDescription>Provide details for the "{selectedScenario && scenarios[selectedScenario].title}" scenario.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="topic">Topic of Conversation</Label>
                        <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'My experience with React' or 'A past project leadership role'" />
                    </div>
                    <div>
                        <Label>Formality</Label>
                        <RadioGroup defaultValue="Formal" value={setting} onValueChange={(v) => setSetting(v as 'Formal' | 'Informal')}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Formal" id="formal" />
                                <Label htmlFor="formal">Formal</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Informal" id="informal" />
                                <Label htmlFor="informal">Informal</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)} disabled={!topic.trim()}>Next</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function SpeakingPracticeClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  type SessionState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused' | 'ready_to_listen';
  const [sessionState, setSessionState] = useState<SessionState>('idle');

  const [sessionConfig, setSessionConfig] = useState<ScenarioSetupConfig | null>(null);
  const [finalFeedback, setFinalFeedback] = useState<PerformanceFeedback | null>(null);
  
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const handleSendAudio = useCallback(async (audioDataUri: string) => {
    if (!sessionConfig || sessionState === 'processing') return;

    setSessionState('processing');

    const thinkingMessage: Message = { role: 'user', content: '...' };
    const currentMessages = messages;
    setMessages((prev) => [...prev, thinkingMessage]);

    try {
        const flowInput = {
            scenario: scenarios[sessionConfig.scenario].persona,
            chatHistory: [
                ...messages, 
            ].map(m => ({ role: m.role, content: m.content })),
            userAudio: audioDataUri,
            topic: sessionConfig.topic,
            setting: sessionConfig.setting,
            voice: sessionConfig.voice,
            isRandomTopic: sessionConfig.scenario === 'random',
        };

        const result = await generateSpeakingPracticeResponse(flowInput);

        if (result.feedback) {
            // Session is complete, show feedback modal
            setFinalFeedback(result.feedback);
            return;
        }

        if (result.transcribedUserText && result.displayResponse && result.audioDataUri) {
             const userMessage: Message = { role: 'user', content: result.transcribedUserText };
             const aiMessage: Message = { role: 'assistant', content: result.displayResponse, audioUrl: result.audioDataUri };
             
             setMessages(prev => [...prev.slice(0, -1), userMessage, aiMessage]);

            if (audioPlayerRef.current) {
                audioPlayerRef.current.src = result.audioDataUri;
                audioPlayerRef.current.play().catch(e => {
                    console.error("Audio play failed", e);
                    setSessionState('ready_to_listen');
                });
            }
        } else {
            throw new Error('AI did not return a valid response.');
        }
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: getAIErrorMessage(e) });
        setMessages(currentMessages); // Revert messages on error
        setSessionState('ready_to_listen');
    }
  }, [sessionConfig, messages, sessionState, toast]);

  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const startRecording = async () => {
      if (isListening) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = event => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
            if (audioChunksRef.current.length > 0) {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                  const audioDataUri = reader.result as string;
                  handleSendAudio(audioDataUri);
                };
            }
            // Clean up the stream
            stream.getTracks().forEach(track => track.stop());
        }

        mediaRecorderRef.current.start();
        setIsListening(true);
        setSessionState('listening');
      } catch (e) {
        toast({ variant: 'destructive', title: 'Microphone Error', description: getAIErrorMessage(e) });
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isListening) {
          mediaRecorderRef.current.stop();
          setIsListening(false);
      }
  };

  
  // Audio player event listeners
  useEffect(() => {
    const player = audioPlayerRef.current;
    if (!player) return;

    const handlePlay = () => setSessionState('speaking');
    const handleEnded = () => setSessionState('ready_to_listen');
    const handlePause = () => {
      if (sessionState === 'speaking') {
          setSessionState('paused');
      }
    };
    
    player.addEventListener('play', handlePlay);
    player.addEventListener('ended', handleEnded);
    player.addEventListener('pause', handlePause);

    return () => {
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('ended', handleEnded);
      player.removeEventListener('pause', handlePause);
    };
  }, [sessionState]);

  const startSession = async (config: ScenarioSetupConfig) => {
    setSessionConfig(config);
    setMessages([]);
    setFinalFeedback(null);
    setSessionState('processing');

    try {
      const result = await generateSpeakingPracticeResponse({
        scenario: scenarios[config.scenario].persona,
        chatHistory: [],
        topic: config.topic,
        setting: config.setting,
        voice: config.voice,
        isRandomTopic: config.scenario === 'random',
      });

      if (result.displayResponse && result.audioDataUri) {
        setMessages([{ role: 'assistant', content: result.displayResponse, audioUrl: result.audioDataUri }]);
        if (audioPlayerRef.current) {
            audioPlayerRef.current.src = result.audioDataUri;
            audioPlayerRef.current.play().catch(e => {
                console.error("Audio play failed on start:", e);
                setSessionState('ready_to_listen');
            });
        }
      } else {
        throw new Error('AI did not return a valid initial response.');
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: getAIErrorMessage(e) });
      setSessionState('idle');
    }
  };

  const handleEndSession = () => {
      if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          audioPlayerRef.current.src = '';
      }
      if (mediaRecorderRef.current && isListening) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setSessionState('idle');
      setSessionConfig(null);
      setMessages([]);
      setFinalFeedback(null);
  }
  
  const handleInterrupt = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setSessionState('ready_to_listen');
  };

  const getStatusIndicator = () => {
    switch (sessionState) {
      case 'listening':
        return <div className="flex items-center gap-2 text-destructive"><Mic className="h-4 w-4 animate-pulse" /> Recording...</div>;
      case 'processing':
        return <div className="flex items-center gap-2 text-primary"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</div>;
      case 'speaking':
        return <div className="flex items-center gap-2 text-blue-500"><User className="h-4 w-4" /> AI Speaking...</div>;
      case 'paused':
        return <div className="flex items-center gap-2 text-muted-foreground"><Pause className="h-4 w-4" /> Paused</div>;
      case 'ready_to_listen':
        return <div className="flex items-center gap-2 text-green-500"><Mic className="h-4 w-4" /> Ready to listen</div>;
      default:
        return <div className="text-muted-foreground">Session Ended</div>;
    }
  };
  
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  if (!sessionConfig) {
      return (
        <ScenarioSetupModal onStart={startSession} />
      );
  }

  return (
    <Card>
       {finalFeedback && <FeedbackDisplayModal feedback={finalFeedback} onDone={handleEndSession} />}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-2xl">{scenarios[sessionConfig.scenario].title}</CardTitle>
            <CardDescription>
              {scenarios[sessionConfig.scenario].description}
            </CardDescription>
          </div>
          <div className="text-sm font-semibold">{getStatusIndicator()}</div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-[60vh]">
        <ScrollArea className="flex-grow p-4 border rounded-md mb-4 bg-background/50" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback><User size={18} /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {sessionState === 'processing' && (
              <div className="flex items-start gap-3 justify-end mt-4">
                <div className="rounded-lg px-4 py-2 bg-primary text-primary-foreground">
                    <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <span>Processing...</span>
                    </div>
                </div>
                 <Avatar className="w-8 h-8">
                    <AvatarFallback><User size={18} /></AvatarFallback>
                  </Avatar>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="grid grid-cols-2 gap-4">
             <Button
                size="lg"
                className="w-full h-14"
                variant={isListening ? 'destructive' : 'default'}
                onClick={isListening ? stopRecording : startRecording}
                disabled={sessionState !== 'ready_to_listen' && !isListening}
            >
                {isListening ? <Square className="mr-2 h-6 w-6" /> : <Mic className="mr-2 h-6 w-6" />}
                {isListening ? 'Stop Recording' : 'Record Answer'}
            </Button>
            <Button
                size="lg"
                className="w-full h-14"
                variant="secondary"
                onClick={handleInterrupt}
                disabled={sessionState !== 'speaking'}
            >
                <Hand className="mr-2 h-6 w-6" /> Interrupt
            </Button>
        </div>
        <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={handleEndSession}>End Session</Button>
        </div>
        <audio ref={audioPlayerRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
