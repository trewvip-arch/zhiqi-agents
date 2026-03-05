import { NextRequest } from 'next/server';
import { sendMessageStream, SendMessageInput } from '@/lib/bailian';
import { addMessage } from '@/app/actions/conversation-actions';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { conversationId, appId, message } = await request.json();

    if (!conversationId || !appId || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save user message
    await addMessage(conversationId, 'user', message);

    // Check if API is configured
    if (!DASHSCOPE_API_KEY) {
      const demoResponse = '演示模式：请配置 DASHSCOPE_API_KEY 以获得真实回复。';
      await addMessage(conversationId, 'assistant', demoResponse);

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: demoResponse })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Stream from 百炼 API
    const input: SendMessageInput = { appId, message };
    const stream = sendMessageStream(input);
    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              fullResponse += chunk.content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
              );
            }
            if (chunk.done) {
              // Save complete response
              await addMessage(conversationId, 'assistant', fullResponse);
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          }
        } catch (error) {
          console.error('[stream] Error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[stream] Route error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
