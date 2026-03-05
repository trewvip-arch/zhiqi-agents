'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Message } from '@/types/conversation';
import { Tag } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';

interface MessageItemProps {
  message: Message;
  agentAvatar: string;
  /** AI SDK 的 UIMessage，包含 parts 数组 */
  aiMessage?: {
    parts?: Array<{
      type: string;
      url?: string;
      filename?: string;
      mediaType?: string;
      text?: string;
    }>;
  };
}

export default function MessageItem({ message, agentAvatar, aiMessage }: MessageItemProps) {
  const isUser = message.role === 'user';

  // 优先使用 AI SDK 的 parts，其次使用 Message 的 files
  const fileParts = aiMessage?.parts?.filter(p => p.type === 'file') || [];
  const hasFiles = (message.files && message.files.length > 0) || fileParts.length > 0;

  // 渲染文件附件
  const renderFiles = () => {
    // 使用 AI SDK 的 file parts
    if (fileParts.length > 0) {
      return (
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/20">
          {fileParts.map((file, index) => (
            <Tag
              key={index}
              icon={<PaperClipOutlined />}
              className={`flex items-center gap-1 ${isUser ? 'bg-white/20 text-white border-0' : 'bg-gray-100'}`}
            >
              {file.url ? (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${isUser ? 'text-white hover:text-blue-200 underline' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  {file.filename || '文件'}
                </a>
              ) : (
                file.filename || '文件'
              )}
            </Tag>
          ))}
        </div>
      );
    }

    // 使用传统的 files 字段
    if (!message.files || message.files.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/20">
        {message.files.map((file, index) => (
          <Tag
            key={index}
            icon={<PaperClipOutlined />}
            className={`flex items-center gap-1 ${isUser ? 'bg-white/20 text-white border-0' : 'bg-gray-100'}`}
          >
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${isUser ? 'text-white hover:text-blue-200 underline' : 'text-blue-600 hover:text-blue-800'}`}
            >
              {file.name}
            </a>
          </Tag>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span className="text-2xl flex-shrink-0">
        {isUser ? '👤' : agentAvatar}
      </span>
      <div
        className={`max-w-[70%] p-4 rounded-2xl ${
          isUser
            ? 'bg-blue-500 text-white rounded-tr-none'
            : 'bg-white rounded-tl-none shadow-sm'
        }`}
      >
        {isUser ? (
          <div>
            <p className="mb-0 whitespace-pre-wrap">{message.content}</p>
            {renderFiles()}
          </div>
        ) : (
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;

                  if (isInline) {
                    return (
                      <code
                        className={`px-1.5 py-0.5 rounded text-sm ${
                          isUser
                            ? 'bg-blue-600/50'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc pl-4 mb-3">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-4 mb-3">{children}</ol>;
                },
                li({ children }) {
                  return <li className="mb-1">{children}</li>;
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`underline ${isUser ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
                    >
                      {children}
                    </a>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto mb-3">
                      <table className="min-w-full border-collapse border border-gray-300">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="border border-gray-300 px-3 py-2 bg-gray-50 font-semibold text-left">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="border border-gray-300 px-3 py-2">
                      {children}
                    </td>
                  );
                },
                blockquote({ children }) {
                  return (
                    <blockquote className={`border-l-4 pl-4 italic ${isUser ? 'border-blue-300' : 'border-gray-300'}`}>
                      {children}
                    </blockquote>
                  );
                },
                h1({ children }) {
                  return <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
