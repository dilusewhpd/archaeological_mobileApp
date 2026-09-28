import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Seeding database...");

  const roles = [
    {
      name: "ADMIN",
      description: "System Administrator",
    },
    {
      name: "ANALYST",
      description: "Archaeological Data Analyst",
    },
    {
      name: "FIELD_OFFICER",
      description: "Field Archaeological Officer",
    },
    {
      name: "SENIOR_OFFICER",
      description: "Senior Archaeological Officer",
    },
  ];

  const roleIds = new Map<string, string>();

  for (const role of roles) {
    const seededRole = await prisma.role.upsert({
      where: {
        name: role.name,
      },
      update: {
        description: role.description,
      },
      create: role,
    });
    roleIds.set(role.name, seededRole.id);
  }

  const testAccounts = [
    {
      firstName: "Field",
      lastName: "Officer",
      email: "field.officer@mobile.test",
      password: "FieldOfficer#2026",
      role: "FIELD_OFFICER",
    },
    {
      firstName: "Senior",
      lastName: "Officer",
      email: "senior.officer@mobile.test",
      password: "SeniorOfficer#2026",
      role: "SENIOR_OFFICER",
    },
    {
      firstName: "Data",
      lastName: "Analyst",
      email: "analyst@mobile.test",
      password: "AnalystPass#2026",
      role: "ANALYST",
    },
    {
      firstName: "System",
      lastName: "Admin",
      email: "admin@mobile.test",
      password: "AdminPass#2026",
      role: "ADMIN",
    },
  ];

  for (const account of testAccounts) {
    const roleId = roleIds.get(account.role);
    if (!roleId) throw new Error(`Missing role ${account.role}.`);

    const passwordHash = await bcrypt.hash(account.password, 10);
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        firstName: account.firstName,
        lastName: account.lastName,
        passwordHash,
        isActive: true,
        mustChangePassword: false,
        roleId,
      },
      create: {
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        passwordHash,
        isActive: true,
        mustChangePassword: false,
        roleId,
      },
    });
  }

  console.log(`Seeded ${roles.length} roles and ${testAccounts.length} test accounts.`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
