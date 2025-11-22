'use server';
/**
 * @fileOverview Implements voice interaction for the interview agent using text-to-speech.
 *
 * - voiceInteraction - A function to convert text to speech and return audio data.
 * - VoiceInteractionOutput - The output type for the voiceInteraction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const VoiceInteractionOutputSchema = z.object({
  media: z.string().describe('Audio data in WAV format as a data URI.'),
});

export type VoiceInteractionOutput = z.infer<typeof VoiceInteractionOutputSchema>;

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

const voiceInteractionFlow = ai.defineFlow(
  {
    name: 'voiceInteractionFlow',
    inputSchema: z.string(),
    outputSchema: VoiceInteractionOutputSchema,
  },
  async (query) => {
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
      prompt: query,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

export async function voiceInteraction(text: string): Promise<VoiceInteractionOutput> {
  return voiceInteractionFlow(text);
}
