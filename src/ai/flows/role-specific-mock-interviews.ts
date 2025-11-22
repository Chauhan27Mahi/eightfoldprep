'use server';
/**
 * @fileOverview This file defines a Genkit flow for conducting role-specific mock interviews.
 *
 * The flow takes a job role as input and generates interview questions tailored to that role.
 * It then simulates an interview by asking the questions and recording the user's responses.
 * Finally, it provides feedback on the user's performance.
 *
 * @interface RoleSpecificMockInterviewInput - Defines the input schema for the flow.
 * @interface RoleSpecificMockInterviewOutput - Defines the output schema for the flow.
 * @function conductMockInterview - The main function to initiate and manage the mock interview flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RoleSpecificMockInterviewInputSchema = z.object({
  jobRole: z.string().describe('The job role for which the mock interview is being conducted.'),
});
export type RoleSpecificMockInterviewInput = z.infer<typeof RoleSpecificMockInterviewInputSchema>;

const RoleSpecificMockInterviewOutputSchema = z.object({
  interviewTranscript: z.string().describe('A transcript of the mock interview, including questions and answers.'),
  performanceFeedback: z.string().describe('Detailed feedback on the user\'s interview performance.'),
});
export type RoleSpecificMockInterviewOutput = z.infer<typeof RoleSpecificMockInterviewOutputSchema>;

/**
 * Main function to conduct a role-specific mock interview.
 * @param {RoleSpecificMockInterviewInput} input - The input object containing the job role.
 * @returns {Promise<RoleSpecificMockInterviewOutput>} - A promise that resolves to the interview transcript and performance feedback.
 */
export async function conductMockInterview(input: RoleSpecificMockInterviewInput): Promise<RoleSpecificMockInterviewOutput> {
  return roleSpecificMockInterviewFlow(input);
}

const roleSpecificMockInterviewPrompt = ai.definePrompt({
  name: 'roleSpecificMockInterviewPrompt',
  input: {schema: RoleSpecificMockInterviewInputSchema},
  output: {schema: RoleSpecificMockInterviewOutputSchema},
  prompt: `You are an AI-powered interview simulator. Your task is to conduct a realistic mock interview for the job role: {{{jobRole}}}.

  Ask relevant interview questions, one at a time, and wait for the user's response before proceeding to the next question.
  After the interview, provide detailed feedback on the user's performance, including communication skills, technical knowledge, and areas for improvement.
  The interview should cover typical questions for the given role, assessing both technical and behavioral aspects.

  Remember to maintain a conversational tone and adapt the difficulty of the questions based on the user's responses.
  The final output should be a comprehensive interview transcript and detailed performance feedback.
  Keep the questions and the feedback concise.
  Do not greet the candidate, just start with the first question.
  End the interview after about 5 questions.
  If the role is ambiguous then use software engineer.
  Do not use the same question twice.
  Consider behavioral questions and technical questions.
  Include the interview transcript and performance feedback in the output.
  Be encouraging to the candidate.
  Strictly adhere to the output format.
  Do not include any personally identifiable information.
  Avoid small talk and do not give the candidate any indication of their performance until the very end when providing feedback.

  Output the interviewTranscript in the following format:
  Question: [Question]
  Answer: [Answer]

  Output the performanceFeedback in the following format:
  Performance Feedback: [Feedback]`, 
});

const roleSpecificMockInterviewFlow = ai.defineFlow(
  {
    name: 'roleSpecificMockInterviewFlow',
    inputSchema: RoleSpecificMockInterviewInputSchema,
    outputSchema: RoleSpecificMockInterviewOutputSchema,
  },
  async input => {
    const {output} = await roleSpecificMockInterviewPrompt(input);
    return output!;
  }
);
