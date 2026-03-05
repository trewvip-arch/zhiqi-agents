import { NextRequest } from 'next/server';
import { sendMessageStream, SendMessageInput } from '@/lib/bailian';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, appId, message, sessionId } = body;

    if (!conversationId || !appId || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!DASHSCOPE_API_KEY) {
      return new Response(JSON.stringify({ error: '请配置 DASHSCOPE_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stream from 百炼 API
    const input: SendMessageInput = { appId, message, sessionId };
    const stream = sendMessageStream(input);

    const encoder = new TextEncoder();
    let capturedSessionId: string | undefined = sessionId;
    const textId = `txt_${Date.now()}`;
    const messageId = `msg_${Date.now()}`;

    // 格式化为 AI SDK 数据流格式
    const formatEvent = (data: object): Uint8Array => {
      return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    };

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // 发送消息开始事件
          controller.enqueue(formatEvent({ type: 'start', messageId }));

          // 发送文本开始事件
          controller.enqueue(formatEvent({ type: 'text-start', id: textId }));

          for await (const chunk of stream) {
            if (chunk.content) {
              // 发送文本增量事件
              controller.enqueue(formatEvent({ type: 'text-delta', id: textId, delta: chunk.content }));
            }
            // 捕获 sessionId（百炼在响应中返回）
            if (chunk.sessionId) {
              capturedSessionId = chunk.sessionId;
            }
            if (chunk.done) {
              // 发送文本结束事件
              controller.enqueue(formatEvent({ type: 'text-end', id: textId }));

              // 发送自定义数据类型 - sessionId
              // 使用 transient: true 使其不会被添加到消息历史
              if (capturedSessionId && capturedSessionId !== sessionId) {
                controller.enqueue(
                  formatEvent({
                    type: 'data-session',
                    data: { sessionId: capturedSessionId },
                    transient: true,
                  })
                );
              }

              controller.close();
            }
          }
        } catch (error) {
          console.error('[stream] Error:', error);
          controller.enqueue(
            formatEvent({
              type: 'error',
              error: error instanceof Error ? error.message : 'Stream error',
            })
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'x-vercel-ai-ui-message-stream': 'v1',
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
