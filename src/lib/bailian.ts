const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1/apps';

export interface SendMessageInput {
  appId: string;
  message: string;
  sessionId?: string;
}

export interface BailianResponse {
  success: boolean;
  content?: string;
  sessionId?: string;
  error?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export async function* sendMessageStream(
  input: SendMessageInput
): AsyncGenerator<StreamChunk> {
  const { appId, message, sessionId } = input;

  if (!DASHSCOPE_API_KEY) {
    throw new Error('请在 .env.local 中配置 DASHSCOPE_API_KEY');
  }

  const response = await fetch(`${DASHSCOPE_BASE_URL}/${appId}/completion`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
      'X-DashScope-SSE': 'enable',
    },
    body: JSON.stringify({
      input: {
        prompt: message,
        session_id: sessionId,
      },
      parameters: {
        incremental_output: true,
      },
      debug: {},
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`百炼 API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('[bailian] Stream done');
        yield { content: '', done: true };
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log('[bailian] Raw chunk:', chunk.slice(0, 200));
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          console.log('[bailian] Data line:', data.slice(0, 200));
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            console.log('[bailian] Parsed:', JSON.stringify(parsed).slice(0, 200));
            const content = parsed.output?.text || '';
            if (content) {
              yield { content, done: false };
            }
          } catch (e) {
            console.log('[bailian] JSON parse error:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function sendMessage(input: SendMessageInput): Promise<BailianResponse> {
  const { appId, message, sessionId } = input;

  if (!DASHSCOPE_API_KEY) {
    return { success: false, error: '请在 .env.local 中配置 DASHSCOPE_API_KEY' };
  }

  try {
    const response = await fetch(`${DASHSCOPE_BASE_URL}/${appId}/completion`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt: message,
          session_id: sessionId,
        },
        parameters: {},
        debug: {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      content: data.output?.text || '',
      sessionId: data.output?.session_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
