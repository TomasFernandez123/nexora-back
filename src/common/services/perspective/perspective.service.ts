import { Injectable, HttpException } from '@nestjs/common';

@Injectable()
export class PerspectiveService {
  private readonly apiKey = process.env.PERSPECTIVE_API_KEY;

  async analyzeText(text: string): Promise<{toxicity: number; insult: number; profanity: number;}> {
    console.log('Analyzing text with Perspective API:', text);
    
    try {
      const body = {
        comment: { text },
        languages: ['es'],
        doNotStore: true,
        requestedAttributes: {
          TOXICITY: {},
          INSULT: {},
          PROFANITY: {},
        },
      };

      const response = await fetch(
        `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json();

      console.log('Perspective API response data:', data);

      const attributes = data.attributeScores || {};

      console.log('Perspective API response attributes:', attributes);

      return {
        toxicity: attributes.TOXICITY?.summaryScore?.value ?? 0,
        insult: attributes.INSULT?.summaryScore?.value ?? 0,
        profanity: attributes.PROFANITY?.summaryScore?.value ?? 0,
      };
    } catch (err) {
      console.error('Perspective API error:', err);
      throw new HttpException('Error analyzing text', 500);
    }
  }
}
