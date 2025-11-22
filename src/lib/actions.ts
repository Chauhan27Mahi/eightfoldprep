'use server';

import { generateFollowUpQuestion, GenerateFollowUpQuestionInput } from '@/ai/flows/intelligent-follow-up-questions';
import { generatePerformanceFeedback, PerformanceFeedbackInput } from '@/ai/flows/detailed-performance-feedback';
import { generateExpressiveAudio } from '@/ai/flows/expressive-voice-interaction';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const InitialQuestionInputSchema = z.object({
  jobRole: z.string(),
});

const InitialQuestionOutputSchema = z.object({
  question: z.string(),
});

const initialQuestionPrompt = ai.definePrompt({
  name: 'initialQuestionPrompt',
  input: { schema: InitialQuestionInputSchema },
  output: { schema: InitialQuestionOutputSchema },
  prompt: `Generate one creative and engaging opening interview question for a {{jobRole}} position. The question should be designed to be a good ice-breaker but also relevant to the role.`,
});

export async function generateFirstQuestion(jobRole: string) {
  try {
    const { output } = await initialQuestionPrompt({ jobRole });
    return { success: true, question: output?.question };
  } catch (error) {
    console.error('Error generating first question:', error);
    return { success: false, error: 'Failed to generate initial question.' };
  }
}

export async function generateFollowUp(input: GenerateFollowUpQuestionInput) {
  try {
    const result = await generateFollowUpQuestion(input);
    return { success: true, question: result.followUpQuestion };
  } catch (error) {
    console.error('Error generating follow-up:', error);
    return { success: false, error: 'Failed to generate follow-up question.' };
  }
}

export async function getFeedback(input: PerformanceFeedbackInput) {
  try {
    const feedback = await generatePerformanceFeedback(input);
    return { success: true, feedback };
  } catch (error) {
    console.error('Error generating feedback:', error);
    return { success: false, error: 'Failed to generate feedback.' };
  }
}

export async function getAudio(text: string) {
  try {
    const { media } = await generateExpressiveAudio(text);
    return { success: true, audioData: media };
  } catch (error) {
    console.error('Error getting audio:', error);
    return { success: false, error: 'Failed to generate audio.' };
  }
}
