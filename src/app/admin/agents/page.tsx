'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Agent } from '@/types/agent';
import { getAgents, deleteAgent } from '@/app/actions/agent';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const data = await getAgents();
    setAgents(data);
    setLoading(false);
  };

  const handleDelete = (agent: Agent) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除「${agent.name}」吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const success = await deleteAgent(agent.id);
        if (success) {
          message.success('删除成功');
          loadAgents();
        } else {
          message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 60,
      render: (avatar: string) => <span style={{ fontSize: 24 }}>{avatar}</span>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Agent) => (
        <Link href={`/chat/${record.id}`} style={{ color: '#1890ff' }}>
          {name}
        </Link>
      ),
    },
    {
      title: 'App ID',
      dataIndex: 'appId',
      key: 'appId',
      ellipsis: true,
      render: (appId: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#666' }}>
          {appId || '未配置'}
        </span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <Space size={[0, 4]} wrap>
          {tags?.map(tag => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Agent) => (
        <Space>
          <Link href={`/admin/agents/${record.id}/edit`}>
            <Button type="link" icon={<EditOutlined />} size="small">
              编辑
            </Button>
          </Link>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <RobotOutlined />
            <span>数字员工管理</span>
          </Space>
        }
        extra={
          <Link href="/admin/agents/new">
            <Button type="primary" icon={<PlusOutlined />}>
              添加员工
            </Button>
          </Link>
        }
      >
        <Table
          dataSource={agents}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
