import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });
  const email = process.argv[2];
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { include: { church: { select: { name: true, id: true } } } } },
  });
  if (!user) {
    console.log(`No user found with email ${email}`);
  } else {
    console.log(JSON.stringify({
      id: user.id, name: user.name, email: user.email, createdAt: user.createdAt,
      memberships: user.memberships.map((m) => ({ role: m.role, church: m.church.name, churchId: m.church.id })),
    }, null, 2));
  }
  await prisma.$disconnect();
}
main();
