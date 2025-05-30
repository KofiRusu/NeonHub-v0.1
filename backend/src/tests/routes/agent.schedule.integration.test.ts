import request from 'supertest';
import app from '../../app';
import prisma from '../../../utils/prisma';

// Use a test JWT or mock authentication
const token = process.env.TEST_JWT || 'test-token';
// Use a fixed UUID for integration testing
const agentId = '00000000-0000-0000-0000-000000000000';

describe('Agent Scheduling Integration Endpoints', () => {
  beforeAll(async () => {
    // Ensure clean test agent exists
    await prisma.aIAgent.upsert({
      where: { id: agentId },
      update: {},
      create: { id: agentId, name: 'Integration Test Agent', type: 'TEST' },
    });
  });

  afterAll(async () => {
    // Clean up scheduled tasks and sessions
    await prisma.scheduledTask.deleteMany({ where: { agentId } });
    await prisma.agentExecutionSession.deleteMany({ where: { agentId } });
    await prisma.aIAgent.delete({ where: { id: agentId } });
    await prisma.$disconnect();
  });

  it('should schedule, list, and unschedule an agent task successfully', async () => {
    // Schedule task
    const scheduleRes = await request(app)
      .post(`/api/agents/${agentId}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cronExpression: '0 0 * * *', priority: 'NORMAL', enabled: true });
    expect(scheduleRes.status).toBe(200);
    expect(scheduleRes.body.success).toBe(true);
    const taskId = scheduleRes.body.data.id;

    // List tasks
    const listRes = await request(app)
      .get(`/api/agents/${agentId}/schedule`)
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.some((t: any) => t.id === taskId)).toBe(true);

    // Unschedule task
    const deleteRes = await request(app)
      .delete(`/api/agents/${agentId}/schedule/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Confirm removal
    const listAfterDelete = await request(app)
      .get(`/api/agents/${agentId}/schedule`)
      .set('Authorization', `Bearer ${token}`);
    expect(listAfterDelete.body.data.every((t: any) => t.id !== taskId)).toBe(
      true,
    );
  });

  it('should return recent execution sessions array', async () => {
    const res = await request(app)
      .get(`/api/agents/${agentId}/sessions`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return scheduler status overview', async () => {
    const res = await request(app)
      .get('/api/agents/scheduler/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('runningTasks');
    expect(res.body.data).toHaveProperty('queuedTasks');
  });
});
