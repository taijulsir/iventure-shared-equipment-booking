-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "reservations_user_id_idx" ON "reservations"("user_id");

-- CreateIndex
CREATE INDEX "reservations_equipment_id_idx" ON "reservations"("equipment_id");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Reservation time-range invariant
--
-- Prisma's schema DSL has no way to express a multi-column CHECK constraint,
-- so this is hand-written. Enforces the basic sanity rule that a reservation's
-- start must precede its end, at the database level, regardless of what any
-- application layer validates.
-- ---------------------------------------------------------------------------
ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_start_before_end_check"
  CHECK ("start_time" < "end_time");

-- ---------------------------------------------------------------------------
-- Reservation overlap prevention (docs/decisions.md, "Reservation Overlap
-- Protection")
--
-- Prisma's schema DSL cannot express a PostgreSQL EXCLUDE constraint, so this
-- is hand-written raw SQL rather than a Prisma-generated statement.
--
-- btree_gist is required because the exclusion constraint mixes an equality
-- comparison on a scalar column (equipment_id) with a range-overlap
-- comparison (tsrange && tsrange) in the same GiST index; btree_gist supplies
-- the GiST operator class needed for the equality half of that comparison.
--
-- Only PENDING and CONFIRMED reservations participate (the WHERE clause), so
-- REJECTED and CANCELLED reservations never block a time slot — matching the
-- Reservation Status Model's slot-blocking rule.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_no_overlapping_active_ranges"
  EXCLUDE USING GIST (
    "equipment_id" WITH =,
    tsrange("start_time", "end_time") WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));
