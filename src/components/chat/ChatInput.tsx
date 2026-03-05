'use client';

import { useState, KeyboardEvent, useRef } from 'react';
import { Input, Button, Tag, App, Upload, message } from 'antd';
import { SendOutlined, PaperClipOutlined, CloseOutlined, InboxOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export interface AttachedFile {
  url: string;
  name: string;
}

interface ChatInputProps {
  onSend: (message: string, files?: AttachedFile[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  disabled,
  placeholder = '输入您的问题...',
}: ChatInputProps) {
  const { message: antdMessage } = App.useApp();
  const [value, setValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed, attachedFiles.length > 0 ? attachedFiles : undefined);
      setValue('');
      setAttachedFiles([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 触发文件选择
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 上传文件到服务器
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error('Upload failed');
        }

        const data = await res.json();
        setAttachedFiles(prev => [...prev, { url: data.url, name: data.filename }]);
      } catch (error) {
        antdMessage.error('文件上传失败');
      }
    }

    setUploading(false);
    // 清空文件输入，以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 bg-white border-t">
      {/* 已附加的文件标签 */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 max-w-4xl mx-auto">
          {attachedFiles.map((file, index) => (
            <Tag
              key={index}
              closable
              onClose={(e) => {
                e.preventDefault();
                handleRemoveFile(index);
              }}
              closeIcon={<CloseOutlined />}
              className="flex items-center gap-1"
            >
              <PaperClipOutlined className="text-xs" />
              <span className="max-w-[200px] truncate">{file.name}</span>
            </Tag>
          ))}
        </div>
      )}
      <div className="flex gap-2 max-w-4xl mx-auto">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="*/*"
          multiple
        />
        <Button
          icon={<InboxOutlined />}
          onClick={handleFileButtonClick}
          disabled={disabled || uploading}
          title="上传文件（文件问答）"
          loading={uploading}
        />
        <TextArea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoSize={{ minRows: 1, maxRows: 4 }}
          className="flex-1"
          disabled={disabled}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!value.trim() || disabled}
        />
      </div>
    </div>
  );
}
