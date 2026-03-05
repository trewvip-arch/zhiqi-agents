import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 生成唯一文件名
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() || 'bin';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    // 保存到 public/uploads 目录
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    // 返回可访问的 URL
    const url = `/uploads/${uniqueName}`;

    return NextResponse.json({
      url,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
