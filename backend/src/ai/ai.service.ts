import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private aiClient: any; // Use any since types might vary based on installation

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
      } catch (e) {
        this.logger.error('Failed to initialize Google GenAI client', e);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY is not defined. AI Chatbot is disabled.');
    }
  }

  async generateChatResponse(messages: any[], userRole: string, userName: string) {
    if (!this.aiClient) {
      return { answer: 'AI configuration is missing. Please contact support.' };
    }

    try {
      const systemInstruction = `You are a helpful and friendly AI assistant for Comfort Haven, a premium vacation rental platform.
You are chatting with ${userName}, who is a ${userRole}. 
${userRole === 'host' ? 'As a host, they rent out their properties. Help them manage properties, understand bookings, or boost earnings.' : 'As a guest, they book properties to stay at. Help them find stays, understand their bookings, or answer general questions about the platform.'}
Be concise, polite, and helpful. Format your responses using markdown where appropriate.`;

      // Extract the last message text or format the conversation history block
      const conversationContext = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      
      const prompt = `[SYSTEM: ${systemInstruction}]\n\nConversation History:\n${conversationContext}\n\nAssistant:`;

      const response = await this.aiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
      });

      return { answer: response.text };
    } catch (error) {
      this.logger.error('Error generating AI response', error);
      throw new InternalServerErrorException('Failed to generate AI response. Please try again later.');
    }
  }
}
