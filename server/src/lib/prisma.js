// Shared PrismaClient singleton.
//
// Previously every route/lib module did `new PrismaClient()`, opening a separate
// connection pool per module (19+ pools). On a small Lightsail Postgres that risks
// connection exhaustion. Import this single instance everywhere instead.
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

const prisma = globalForPrisma.__giisPrisma || new PrismaClient();

if (!globalForPrisma.__giisPrisma) {
  globalForPrisma.__giisPrisma = prisma;
}

module.exports = prisma;
