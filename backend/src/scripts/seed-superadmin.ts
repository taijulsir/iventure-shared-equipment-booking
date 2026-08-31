import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../generated/prisma/client.js';
import { HashingService } from '../auth/hashing.service.js';

/**
 * Bootstraps the single, initial SuperAdmin account. Unlike seed-admin.ts
 * (a dev/Postman-testing fixture that accepts hardcoded fallback values),
 * this script provisions a real privileged account and refuses to run with
 * anything less than fully-specified credentials — no fallback email,
 * password, or name is baked in here.
 *
 * Exactly one SuperAdmin is expected to exist system-wide (see
 * docs/decisions.md and the SuperAdmin implementation report). Re-running
 * this script is safe:
 *   - No existing SUPERADMIN anywhere -> create/upgrade the configured
 *     account.
 *   - An existing SUPERADMIN with the SAME configured email -> update it in
 *     place (e.g. to rotate the password), never creating a duplicate.
 *   - An existing SUPERADMIN with a DIFFERENT email than currently
 *     configured -> refuse. Silently creating a second SUPERADMIN row (or
 *     silently repointing "the" SuperAdmin to a different email) would
 *     violate the "exactly one SuperAdmin" invariant that user-management
 *     authorization elsewhere in the app depends on.
 */
const email = process.env.SUPERADMIN_EMAIL;
const password = process.env.SUPERADMIN_PASSWORD;
const name = process.env.SUPERADMIN_NAME;

if (!email || !password || !name) {
  console.error(
    'seed-superadmin: SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, and SUPERADMIN_NAME must all be set ' +
      '(see backend/.env.example) — refusing to bootstrap with defaulted/hardcoded credentials.',
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('seed-superadmin: DATABASE_URL is not set.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const hashingService = new HashingService();

async function main(): Promise<void> {
  const normalizedEmail = email!.trim().toLowerCase();

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: Role.SUPERADMIN },
  });

  if (existingSuperAdmin && existingSuperAdmin.email !== normalizedEmail) {
    console.error(
      `seed-superadmin: a SuperAdmin already exists (${existingSuperAdmin.email}), which does not match ` +
        `the configured SUPERADMIN_EMAIL (${normalizedEmail}). Refusing to create a second SuperAdmin. ` +
        'If you intend to change who the SuperAdmin is, use the user-management role-change flow, or ' +
        'update this account directly and deliberately rather than via this bootstrap script.',
    );
    process.exit(1);
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingByEmail && existingByEmail.role !== Role.SUPERADMIN) {
    console.log(
      `seed-superadmin: an existing ${existingByEmail.role} account (${normalizedEmail}) will be ` +
        'promoted to SUPERADMIN because it matches the configured SUPERADMIN_EMAIL.',
    );
  }

  const passwordHash = await hashingService.hash(password!);

  const superAdmin = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { passwordHash, role: Role.SUPERADMIN, name: name! },
    create: { email: normalizedEmail, passwordHash, role: Role.SUPERADMIN, name: name! },
  });

  console.log(`SuperAdmin account ready: ${superAdmin.email} (id: ${superAdmin.id})`);
}

main()
  .catch((error: unknown) => {
    console.error('seed-superadmin: failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
