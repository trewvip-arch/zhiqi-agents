'use client';

import { useState, useEffect, use } from 'react';
import { Form, Input, Button, Card, Select, Tag, Space, message, Spin } from 'antd';
import { ArrowLeftOutlined, RobotOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAgentById, updateAgent } from '@/app/actions/agent';
import { Agent } from '@/types/agent';

const EMOJI_OPTIONS = ['🤖', '👤', '📊', '💼', '💰', '📦', '📈', '🎯', '🔧', '📝', '🎨', '🧠', '⚡', '🌟', '🚀'];

interface EditAgentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditAgentPage({ params }: EditAgentPageProps) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    loadAgent();
  }, [id]);

  const loadAgent = async () => {
    setLoading(true);
    const agent = await getAgentById(id);
    if (agent) {
      form.setFieldsValue(agent);
      setTags(agent.tags || []);
    } else {
      message.error('未找到该数字员工');
      router.push('/admin/agents');
    }
    setLoading(false);
  };

  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag]);
      setInputTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const onFinish = async (values: Omit<Agent, 'id'>) => {
    setSaving(true);
    try {
      const agentData = {
        ...values,
        tags,
      };
      await updateAgent(id, agentData);
      message.success('保存成功');
      router.push('/admin/agents');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <RobotOutlined />
            <span>编辑数字员工</span>
          </Space>
        }
        extra={
          <Link href="/admin/agents">
            <Button icon={<ArrowLeftOutlined />}>返回列表</Button>
          </Link>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="avatar"
            label="头像"
            rules={[{ required: true, message: '请选择头像' }]}
          >
            <Select style={{ width: 100 }}>
              {EMOJI_OPTIONS.map(emoji => (
                <Select.Option key={emoji} value={emoji}>
                  <span style={{ fontSize: 24 }}>{emoji}</span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="例如：AI招聘数字员工 Hirely" />
          </Form.Item>

          <Form.Item
            name="appId"
            label="百炼 App ID"
            rules={[{ required: true, message: '请输入百炼应用的 App ID' }]}
          >
            <Input placeholder="例如：3d27e0bb63db49f9910c1ba80a2478d0" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={3} placeholder="描述该数字员工的功能和特点" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择或输入分类' }]}
          >
            <Select
              mode="tags"
              placeholder="选择或输入分类"
              options={[
                { value: '人力资源' },
                { value: '项目管理' },
                { value: '金融' },
                { value: '营销' },
                { value: '客服' },
                { value: '通用' },
              ]}
            />
          </Form.Item>

          <Form.Item label="标签">
            <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
              <Input
                placeholder="输入标签后按回车或点击添加"
                value={inputTag}
                onChange={e => setInputTag(e.target.value)}
                onPressEnter={handleAddTag}
              />
              <Button type="primary" onClick={handleAddTag}>
                添加
              </Button>
            </Space.Compact>
            <Space size={[0, 8]} wrap>
              {tags.map(tag => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  color="blue"
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存
              </Button>
              <Link href="/admin/agents">
                <Button>取消</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
