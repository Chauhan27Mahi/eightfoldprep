'use server';
/**
 * @fileOverview Implements an advanced voice interaction flow that first analyzes
 * text to determine sentiment, then injects expressive cues (like pauses or laughs)
 * before converting it to speech.
 *
 * - generateExpressiveAudio - A function to convert text to expressive speech.
 * - ExpressiveVoiceInteractionOutput - The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

// Define the schema for the output of the sentiment analysis prompt
const ExpressiveTextOutputSchema = z.object({
  expressiveText: z.string().describe('The text modified with expressive cues like [laugh] or [short pause].'),
});

// Define the prompt for analyzing sentiment and adding expressive cues
const expressiveTextPrompt = ai.definePrompt({
    name: 'expressiveTextPrompt',
    input: { schema: z.string() },
    output: { schema: ExpressiveTextOutputSchema },
    prompt: `Analyze the following text and rewrite it with expressive cues to make it sound more human and natural for a text-to-speech engine.

    The speaker is an AI interview coach. The tone should generally be professional but can be friendly, encouraging, or even show a bit of light pressure depending on the context.
    
    Use the following cues where appropriate:
    - [short pause], [medium pause], [long pause] for pacing.
    - [laughing] for lighthearted moments.
    - [uhm], [sigh] for natural hesitations.
    - [shouting], [whispering] for emphasis, but use these sparingly.
    - You can also add style instructions at the beginning, like "Speak in a friendly and encouraging tone."

    Original text: {{{input}}}
    
    Your task is to return only the modified text with the added cues.`,
});


const ExpressiveVoiceInteractionOutputSchema = z.object({
  media: z.string().describe('Audio data in WAV format as a data URI.'),
});
export type ExpressiveVoiceInteractionOutput = z.infer<typeof ExpressiveVoiceInteractionOutputSchema>;


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const expressiveVoiceInteractionFlow = ai.defineFlow(
  {
    name: 'expressiveVoiceInteractionFlow',
    inputSchema: z.string(),
    outputSchema: ExpressiveVoiceInteractionOutputSchema,
  },
  async (originalText) => {
    // 1. Generate the expressive text
    const { output: expressiveTextOutput } = await expressiveTextPrompt(originalText);
    const textToSpeak = expressiveTextOutput?.expressiveText || originalText;

    // 2. Generate the audio from the expressive text
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: textToSpeak,
    });

    if (!media) {
      throw new Error('no media returned');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    // 3. Convert PCM audio to WAV format
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

export async function generateExpressiveAudio(text: string): Promise<ExpressiveVoiceInteractionOutput> {
  return expressiveVoiceInteractionFlow(text);
}
