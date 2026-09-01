// Dev-only convenience script: seeds (or updates) exactly one Administrator
// account, matching how docs/decisions.md says Administrator accounts must
// be provisioned -- "seeded directly in the database", never through public
// registration. This is not part of the HTTP API; it's a local setup helper
// for developers who want to exercise Admin-only endpoints (including via
// the Postman collection under postman/), the same way the project's own
// e2e tests seed an admin directly through Prisma.
//
// Not wired into AppModule -- compiled by the normal `nest build` alongside
// everything else in src/, then run standalone via `npm run seed:admin`
// (see package.json), which builds first and runs the compiled output.
//
// Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from the environment if
// set; otherwise falls back to the same defaults committed in
// postman/environments/iventure-local.postman_environment.json, so the
// Postman collection works out of the box against a freshly cloned repo.
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../generated/prisma/client.js';

const email = process.env.ADMIN_EMAIL ?? 'admin@iventure.local';
const password = process.env.ADMIN_PASSWORD ?? 'PostmanAdmin!2026';
const name = process.env.ADMIN_NAME ?? 'Postman Admin';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Run this with `npm run seed:admin` (loads backend/.env).');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN, name },
    create: { email, passwordHash, role: Role.ADMIN, name },
  });

  console.log(`Administrator account ready: ${admin.email} (id: ${admin.id})`);
  console.log('This matches the adminEmail/adminPassword defaults in the committed Postman environment.');
}

main()
  .catch((error: unknown) => {
    console.error('Failed to seed Administrator account:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
