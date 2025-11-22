'use server';

/**
 * @fileOverview Generates detailed performance feedback for a mock interview, including communication skills,
 * technical knowledge, and areas for improvement.
 *
 * - generatePerformanceFeedback - A function that generates the performance feedback.
 * - PerformanceFeedbackInput - The input type for the generatePerformanceFeedback function.
 * - PerformanceFeedbackOutput - The return type for the generatePerformanceFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PerformanceFeedbackInputSchema = z.object({
  interviewTranscript: z
    .string()
    .describe('The complete transcript of the mock interview.'),
  jobDescription: z.string().describe('The job description for the role.'),
});
export type PerformanceFeedbackInput = z.infer<typeof PerformanceFeedbackInputSchema>;

const PerformanceFeedbackOutputSchema = z.object({
  communicationSkills: z
    .string()
    .describe(
      'Feedback on the candidate\'s communication skills, including clarity, conciseness, and active listening.'
    ),
  technicalKnowledge: z
    .string()
    .describe(
      'Feedback on the candidate\'s technical knowledge and expertise relevant to the job role.'
    ),
  areasForImprovement: z
    .string()
    .describe('Specific areas where the candidate can improve their interview performance.'),
  overallFeedback: z.string().describe('Overall summary of the candidate\'s interview performance'),
});
export type PerformanceFeedbackOutput = z.infer<typeof PerformanceFeedbackOutputSchema>;

export async function generatePerformanceFeedback(
  input: PerformanceFeedbackInput
): Promise<PerformanceFeedbackOutput> {
  return performanceFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'performanceFeedbackPrompt',
  input: {schema: PerformanceFeedbackInputSchema},
  output: {schema: PerformanceFeedbackOutputSchema},
  prompt: `You are an experienced interview coach providing feedback on a mock interview.

  Analyze the following interview transcript in the context of the provided job description.
  Provide detailed feedback on the candidate\'s communication skills, technical knowledge, and areas for improvement.
  Also include an overall summary of the candidate's performance

  Job Description: {{{jobDescription}}}
  Interview Transcript: {{{interviewTranscript}}}

  Format your response as follows:

  Communication Skills: [Your feedback on communication skills]
  Technical Knowledge: [Your feedback on technical knowledge]
  Areas for Improvement: [Specific areas for improvement]
  Overall feedback: [Overall summary of the candidate\'s interview performance]`,
});

const performanceFeedbackFlow = ai.defineFlow(
  {
    name: 'performanceFeedbackFlow',
    inputSchema: PerformanceFeedbackInputSchema,
    outputSchema: PerformanceFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
