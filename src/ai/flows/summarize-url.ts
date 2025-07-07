'use server';

/**
 * @fileOverview A URL summarization AI agent.
 *
 * - summarizeUrl - A function that handles the URL summarization process.
 * - SummarizeUrlInput - The input type for the summarizeUrl function.
 * - SummarizeUrlOutput - The return type for the summarizeUrl function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as cheerio from 'cheerio';

const SummarizeUrlInputSchema = z.object({
  url: z.string().url().describe('The URL of the page to summarize.'),
});
export type SummarizeUrlInput = z.infer<typeof SummarizeUrlInputSchema>;

const SummarizeUrlOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the page content.'),
});
export type SummarizeUrlOutput = z.infer<typeof SummarizeUrlOutputSchema>;

export async function summarizeUrl(
  input: SummarizeUrlInput
): Promise<SummarizeUrlOutput> {
  return summarizeUrlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeUrlPrompt',
  input: { schema: z.object({ textContent: z.string() }) },
  output: { schema: SummarizeUrlOutputSchema },
  prompt: `You are an expert summarizer. Please provide a concise summary of the following web page content:\n\n{{{textContent}}}`,
});

const summarizeUrlFlow = ai.defineFlow(
  {
    name: 'summarizeUrlFlow',
    inputSchema: SummarizeUrlInputSchema,
    outputSchema: SummarizeUrlOutputSchema,
  },
  async (input) => {
    try {
      const response = await fetch(input.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, head, nav, footer, aside, form, [role="navigation"], [role="search"], [aria-hidden="true"]').remove();
      
      const textContent = $('body').text().replace(/\s\s+/g, ' ').trim();
      
      if (!textContent) {
        return { summary: "Could not extract any content from the URL." };
      }

      const { output } = await prompt({ textContent });
      return output!;

    } catch (error) {
      console.error('Error summarizing URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { summary: `Failed to process URL. ${errorMessage}` };
    }
  }
);
