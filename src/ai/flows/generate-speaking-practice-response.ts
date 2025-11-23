'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

// --- Helper for WAV conversion ---
async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({ channels: 1, sampleRate: 24000, bitDepth: 16 });
    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}

// --- Schemas ---
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const GenerateSpeakingPracticeInputSchema = z.object({
  scenario: z.string().describe("The persona and goal for the AI assistant."),
  chatHistory: z.array(MessageSchema).describe("The ongoing text chat history."),
  userAudio: z.string().optional().describe("The user's spoken response as a data URI."),
  topic: z.string().optional().describe("The topic for the conversation, e.g., 'React hooks'."),
  setting: z.string().optional().describe("The formality setting, e.g., 'Formal' or 'Informal'."),
  voice: z.string().describe('The selected voice for the AI partner.'),
  isRandomTopic: z.boolean().optional().describe('If true, the AI should invent a random, engaging topic.'),
});
export type GenerateSpeakingPracticeInput = z.infer<typeof GenerateSpeakingPracticeInputSchema>;

const PerformanceFeedbackSchema = z.object({
    overallSummary: z.string().describe("A brief, overall summary of the candidate's performance, highlighting strengths and key areas for improvement."),
    clarity: z.string().describe("Feedback on the clarity and conciseness of the user's responses."),
    relevance: z.string().describe("Feedback on how relevant the user's answers were to the questions asked."),
    problemSolving: z.string().describe("Feedback on the user's problem-solving skills and thought process, especially in technical scenarios."),
});
export type PerformanceFeedback = z.infer<typeof PerformanceFeedbackSchema>;

const GenerateSpeakingPracticeOutputSchema = z.object({
  spokenResponse: z.string().optional().describe("The AI's full response, including tonal cues for the TTS engine, e.g., '(Sighs) Well, that's one way to look at it.'"),
  displayResponse: z.string().optional().describe("The clean version of the AI's response, with all tonal cues removed. This is for display in the chat UI."),
  audioDataUri: z.string().optional().describe("The AI's spoken response as a data URI in WAV format."),
  transcribedUserText: z.string().optional().describe("The transcription of the user's audio input."),
  feedback: PerformanceFeedbackSchema.optional().describe("The final performance feedback, provided only at the end of the session."),
});
export type GenerateSpeakingPracticeOutput = z.infer<typeof GenerateSpeakingPracticeOutputSchema>;


// --- Main Exported Function ---

export async function generateSpeakingPracticeResponse(input: GenerateSpeakingPracticeInput): Promise<GenerateSpeakingPracticeOutput> {
  return generateSpeakingPracticeFlow(input);
}


// --- Genkit Definitions ---
const TranscriptionSchema = z.object({
    transcript: z.string().describe('The transcribed text from the user\'s audio.'),
});

const transcribeUserAudio = ai.defineTool(
    {
        name: 'transcribeUserAudio',
        description: 'Transcribes the user\'s spoken audio into text.',
        inputSchema: z.object({ audio: z.string().describe('The user\'s audio as a data URI.') }),
        outputSchema: TranscriptionSchema,
    },
    async ({ audio }) => {
        const { text } = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: [{ media: { url: audio } }, { text: 'Transcribe the audio.' }],
        });
        return { transcript: text! };
    }
);

const responseAndFeedbackSchema = z.object({
    response: z.string().describe("The AI's full response, including emotional and pacing cues in brackets like [thoughtful] or [sighs]. If the session is over, this should be the final concluding remark before feedback."),
    isSessionComplete: z.boolean().describe("Set to true only if the conversation has reached a natural conclusion (e.g., after 10-12 exchanges) and it's time to provide feedback."),
    feedback: PerformanceFeedbackSchema.optional().describe("Provide this structured feedback object ONLY if isSessionComplete is true."),
});

const generateResponsePrompt = ai.definePrompt({
  name: 'generateSpeakingPracticePrompt',
  input: { schema: GenerateSpeakingPracticeInputSchema.extend({ transcribedUserText: z.string().optional() }) },
  output: { schema: responseAndFeedbackSchema },
  model: 'googleai/gemini-2.5-flash',
  tools: [transcribeUserAudio],
  prompt: `You are a live role-playing partner. Your personality and goals are defined by the scenario. Your task is to have a natural, spoken conversation with the user.

**CRITICAL INSTRUCTIONS:**
1.  **Inject Expressive Cues:** Your spoken response MUST include a variety of expressive, non-speech markup tags in brackets to guide your speech synthesis. This is essential for sounding human.
    *   **Pauses:** Use [short pause], [medium pause], [long pause] to control pacing.
    *   **Vocalizations:** Use [sigh], [laughing], [uhm] for realistic reactions and hesitations.
    *   **Style:** Use [shouting], [whispering] for emphasis where appropriate.
    *   **Example:** "[uhm]... well, [short pause] that's an interesting way to look at it. [laughing] I hadn't considered that."
2.  **Conversation Arc & Conclusion:**
    *   **First Message:** If the chat history is empty, you MUST start with a brief, friendly introduction. Example: "Hi there, [short pause] thanks for coming in today. I'm Alex, and I'll be leading your interview. To start, [medium pause] could you tell me a little bit about yourself and what led you to apply for this role?"
    *   **Progression:** After the intro, ask progressively deeper questions based on the user's responses.
    *   **Determine Completion:** After about 10-12 exchanges, you MUST decide the interview is over. Set \`isSessionComplete\` to \`true\`.
    *   **Concluding Remark:** If the session is complete, your 'response' field should be a brief concluding remark. Example: "Alright, that was very insightful. [medium pause] I think I have everything I need for now. Thanks for your time."
    *   **Generate Final Feedback:** If \`isSessionComplete\` is true, you MUST provide a detailed, structured feedback object in the 'feedback' field. Evaluate the user's performance throughout the entire conversation.

**SCENARIO:**
---
{{{scenario}}}
{{#if isRandomTopic}}
**Conversation Topic:** You MUST invent a creative, engaging, and random conversation starter. DO NOT always choose Mars. Be creative. For example: "What if humans could photosynthesize?", "What's the most useless superpower you can think of?", or "Describe the perfect sandwich."
{{else if topic}}
**Conversation Topic:** {{{topic}}}
{{/if}}
{{#if setting}}
**Setting:** {{{setting}}}
{{/if}}
---

**CONVERSATION HISTORY (for context):**
---
{{#each chatHistory}}
{{#if content}}{{role}}: {{content}}{{/if}}
{{/each}}
---

{{#if transcribedUserText}}
**LATEST USER RESPONSE (from transcription):**
user: {{transcribedUserText}}
{{else}}
**This is a new session. Your task is to start the conversation based on the rules and scenario above.**
{{/if}}

Now, generate your 'response', determine if the session is complete, and provide feedback if it is.
`,
});

const generateSpeakingPracticeFlow = ai.defineFlow(
  {
    name: 'generateSpeakingPracticeFlow',
    inputSchema: GenerateSpeakingPracticeInputSchema,
    outputSchema: GenerateSpeakingPracticeOutputSchema,
  },
  async (input) => {
    let transcribedUserText: string | undefined = undefined;

    // Step 1: Transcribe user audio if it exists
    if (input.userAudio) {
      const transcriptionResult = await transcribeUserAudio({ audio: input.userAudio });
      transcribedUserText = transcriptionResult.transcript;
    }
    
    // Step 2: Generate the AI's response (and possibly feedback)
    const { output: responseOutput } = await generateResponsePrompt({ ...input, transcribedUserText });

    if (!responseOutput) {
        throw new Error("The AI model did not return a valid response.");
    }
    
    const { response: textToSpeak, isSessionComplete, feedback } = responseOutput;

    // If the session is complete, we just return the feedback. No more audio.
    if (isSessionComplete && feedback) {
        return { feedback };
    }
    
    // Clean the response for UI display by removing bracketed cues
    const displayResponse = textToSpeak.replace(/ *\[[^\]]*\] */g, ' ').trim();

    // Step 3: Use the TTS model to generate audio from the SPOKEN text response.
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voice }, 
          },
        },
      },
      prompt: textToSpeak, // Use the version with expressive cues for the audio
    });
    
    if (!media?.url) {
        throw new Error('TTS model did not return audio media.');
    }

    // Step 4: Convert raw PCM audio to WAV format.
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);
    const audioDataUri = 'data:audio/wav;base64,' + wavBase64;
    
    // Step 5: Return all relevant data.
    return {
      spokenResponse: textToSpeak,
      displayResponse,
      audioDataUri,
      transcribedUserText,
    };
  }
);
