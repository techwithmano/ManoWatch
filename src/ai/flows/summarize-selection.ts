'use server';

/**
 * @fileOverview A text summarization AI agent.
 *
 * - summarizeSelection - A function that handles the text summarization process.
 * - SummarizeSelectionInput - The input type for the summarizeSelection function.
 * - SummarizeSelectionOutput - The return type for the summarizeSelection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSelectionInputSchema = z.object({
  selectedText: z
    .string()
    .describe('The text selected by the user to be summarized.'),
});
export type SummarizeSelectionInput = z.infer<typeof SummarizeSelectionInputSchema>;

const SummarizeSelectionOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the selected text.'),
});
export type SummarizeSelectionOutput = z.infer<typeof SummarizeSelectionOutputSchema>;

export async function summarizeSelection(input: SummarizeSelectionInput): Promise<SummarizeSelectionOutput> {
  return summarizeSelectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSelectionPrompt',
  input: {schema: SummarizeSelectionInputSchema},
  output: {schema: SummarizeSelectionOutputSchema},
  prompt: `You are an expert summarizer. Please provide a concise summary of the following text:\n\n{{{selectedText}}}`,
});

const summarizeSelectionFlow = ai.defineFlow(
  {
    name: 'summarizeSelectionFlow',
    inputSchema: SummarizeSelectionInputSchema,
    outputSchema: SummarizeSelectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
