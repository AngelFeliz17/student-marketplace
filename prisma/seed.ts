import { PrismaClient } from 'generated/prisma/client';
import { UserRole } from 'generated/prisma/client';
import * as argon from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const password = await argon.hash(process.env.ADMIN_PASSWORD!);

  const university = await prisma.university.upsert({
    where: {
      name: process.env.UNIVERSITY_NAME!,
    },
    update: {},
    create: {
      name: process.env.UNIVERSITY_NAME!,
    },
  });

  await prisma.emailDomain.upsert({
    where: {
      domain: process.env.EMAIL_DOMAIN!
    },
    update: {},
    create: {
      domain: process.env.EMAIL_DOMAIN!,
      universityId: university.id
    }
  });

  if(!process.env.ADMIN_EMAIL) throw new Error("ADMIN_EMAIL is missing");
  await prisma.user.upsert({
    where: {
      email: 'admin@uni.edu',
    },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL!,
      firstName: process.env.ADMIN_FIRST_NAME!,
      lastName: process.env.ADMIN_LAST_NAME!,
      password,
      verified: true,
      role: UserRole.ADMIN,
      universityId: university.id,
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });