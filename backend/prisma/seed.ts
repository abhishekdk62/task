import { PrismaClient, Role, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const userPassword = await bcrypt.hash('User@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.com' },
    update: {},
    create: {
      email: 'admin@taskflow.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@taskflow.com' },
    update: {},
    create: {
      email: 'user@taskflow.com',
      password: userPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: Role.USER,
    },
  });

  const existingTasks = await prisma.task.count({ where: { userId: user.id } });

  if (existingTasks === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: 'Generate monthly report',
          description: 'Compile analytics and export PDF summary',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          payload: { type: 'report', month: '2026-07' },
          result: { success: true, pages: 12 },
          userId: user.id,
          completedAt: new Date(),
          startedAt: new Date(Date.now() - 60000),
        },
        {
          title: 'Sync CRM contacts',
          description: 'Pull latest contacts from external CRM',
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          payload: { type: 'sync', source: 'crm' },
          userId: user.id,
        },
        {
          title: 'Send welcome emails',
          description: 'Batch welcome campaign for new signups',
          status: TaskStatus.FAILED,
          priority: TaskPriority.LOW,
          payload: { type: 'email', template: 'welcome' },
          error: 'SMTP connection timeout',
          retries: 1,
          userId: user.id,
        },
        {
          title: 'Scheduled data cleanup',
          description: 'Remove expired temporary files',
          status: TaskStatus.PENDING,
          priority: TaskPriority.LOW,
          payload: { type: 'cleanup', olderThanDays: 30 },
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          userId: user.id,
        },
        {
          title: 'Admin audit export',
          description: 'Export audit logs for compliance',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.HIGH,
          payload: { type: 'export', format: 'csv' },
          result: { rows: 1540 },
          userId: admin.id,
          completedAt: new Date(),
        },
      ],
    });
  }

  console.log('Seed complete:');
  console.log(`  Admin: admin@taskflow.com / Admin@123`);
  console.log(`  User:  user@taskflow.com / User@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
