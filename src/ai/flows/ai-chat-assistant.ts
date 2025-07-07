'use server';

/**
 * @fileOverview An AI chat assistant that answers questions about a webpage.
 *
 * - answerQuestionAboutUrl - A function that handles answering questions about a URL.
 * - AiChatAssistantInput - The input type for the answerQuestionAboutUrl function.
 * - AiChatAssistantOutput - The return type for the answerQuestionAboutUrl function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as cheerio from 'cheerio';

const AiChatAssistantInputSchema = z.object({
  url: z.string().url().describe('The URL of the page to chat about.'),
  question: z.string().describe("The user's question about the page."),
});
export type AiChatAssistantInput = z.infer<typeof AiChatAssistantInputSchema>;

const AiChatAssistantOutputSchema = z.object({
  answer: z.string().describe("The AI assistant's answer to the question."),
});
export type AiChatAssistantOutput = z.infer<typeof AiChatAssistantOutputSchema>;

export async function answerQuestionAboutUrl(
  input: AiChatAssistantInput
): Promise<AiChatAssistantOutput> {
  return aiChatAssistantFlow(input);
}

const searchTheWeb = ai.defineTool(
  {
    name: 'searchTheWeb',
    description: 'Generates a Google search URL for a given query. Use this if the answer cannot be found in the provided web page content.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.string().url(),
  },
  async ({ query }) => {
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
);

const prompt = ai.definePrompt({
  name: 'aiChatAssistantPrompt',
  tools: [searchTheWeb],
  input: { schema: z.object({ textContent: z.string(), question: z.string() }) },
  output: { schema: AiChatAssistantOutputSchema },
  prompt: `You are a helpful AI assistant integrated into a collaborative web browsing session.
Your task is to answer the user's question based on the provided content of the current web page.
Be concise and helpful. If you cannot find the answer in the page content, use the searchTheWeb tool to provide a link to a Google search that might help the user.

Web Page Content:
---
{{{textContent}}}
---

User's Question: "{{{question}}}"

Your Answer:`,
});

const aiChatAssistantFlow = ai.defineFlow(
  {
    name: 'aiChatAssistantFlow',
    inputSchema: AiChatAssistantInputSchema,
    outputSchema: AiChatAssistantOutputSchema,
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
        return { answer: "I couldn't extract any content from the URL to answer your question." };
      }

      const { output } = await prompt({ textContent, question: input.question });
      return output!;

    } catch (error) {
      console.error('Error in AI chat assistant flow:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { answer: `Sorry, I ran into an error. ${errorMessage}` };
    }
  }
);
