import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { stat, readFile } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  try {
    const { file } = await params;

    // 安全检查：防止目录遍历攻击
    if (file.includes('..') || file.includes('/')) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    const filePath = join(process.cwd(), 'public', 'uploads', file);

    // 检查文件是否存在
    await stat(filePath);

    // 读取文件
    const fileBuffer = await readFile(filePath);

    // 根据文件扩展名确定 Content-Type
    const ext = file.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };

    const contentType = contentTypes[ext || ''] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('File not found:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
