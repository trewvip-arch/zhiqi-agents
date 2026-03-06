const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1/apps';

export interface FileInfo {
  url: string; // 文件 URL (百炼支持 URL 格式)
  filename?: string;
}

export interface SendMessageInput {
  appId: string;
  message: string;
  sessionId?: string;
  fileList?: FileInfo[]; // 百炼文件列表
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
  sessionId?: string; // 百炼会话 ID，首次响应返回
}

export async function* sendMessageStream(
  input: SendMessageInput
): AsyncGenerator<StreamChunk> {
  const { appId, message, sessionId, fileList } = input;

  if (!DASHSCOPE_API_KEY) {
    throw new Error('请在 .env.local 中配置 DASHSCOPE_API_KEY');
  }

  const requestBody: Record<string, unknown> = {
    input: {
      prompt: message,
      session_id: sessionId,
    },
    parameters: {
      incremental_output: true,
    },
    debug: {},
  };

  // 添加文件列表（如果有）
  if (fileList && fileList.length > 0) {
    // 百炼 API 期望字符串数组格式
    requestBody.input = {
      ...requestBody.input as object,
      file_list: fileList.map(f => f.url),
    };
  }

  console.log('[bailian] Request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${DASHSCOPE_BASE_URL}/${appId}/completion`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
      'X-DashScope-SSE': 'enable',
    },
    body: JSON.stringify(requestBody),
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
  let lastSessionId: string | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('[bailian] Stream done');
        yield { content: '', done: true, sessionId: lastSessionId };
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            yield { content: '', done: true, sessionId: lastSessionId };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.output?.text || '';
            // 提取 session_id 用于多轮对话
            if (parsed.output?.session_id) {
              lastSessionId = parsed.output.session_id;
            }
            if (content) {
              yield { content, done: false };
            }
          } catch (e) {
            // 跳过无效 JSON
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
