import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // TODO: Add seed data

  console.log('Seeding complete.')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.()
  })
