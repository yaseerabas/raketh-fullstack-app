import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create credit-based plans
  const basicPlan = await prisma.plan.upsert({
    where: { name: 'Basic' },
    update: {},
    create: {
      name: 'Basic',
      price: 1499,
      currency: 'PKR',
      credits: 1000000, // 1 million characters
      maxClones: 5,
      features: JSON.stringify({
        '1 Million characters': true,
        'All voice models': true,
        'Voice cloning': true,
        '5 voice clones': true,
        'Email support': true
      }),
      active: true
    }
  })

  const proPlan = await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: {
      name: 'Pro',
      price: 3499,
      currency: 'PKR',
      credits: 3000000, // 3 million characters
      maxClones: 10,
      features: JSON.stringify({
        '3 Million characters': true,
        'All voice models': true,
        'Voice cloning': true,
        '10 voice clones': true,
        'Priority support': true
      }),
      active: true
    }
  })

  const premiumPlan = await prisma.plan.upsert({
    where: { name: 'Premium' },
    update: {},
    create: {
      name: 'Premium',
      price: 5999,
      currency: 'PKR',
      credits: 5000000, // 5 million characters
      maxClones: 25,
      features: JSON.stringify({
        '5 Million characters': true,
        'All voice models': true,
        'Voice cloning': true,
        '25 voice clones': true,
        'Priority support': true
      }),
      active: true
    }
  })

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'Enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      price: 7999,
      currency: 'PKR',
      credits: 10000000, // 10 million characters
      maxClones: -1, // Unlimited
      features: JSON.stringify({
        '10 Million characters': true,
        'All premium models': true,
        'Voice cloning': true,
        'Unlimited voice clones': true,
        'Dedicated support': true
      }),
      active: true
    }
  })

  // Create admin user with hashed password
  // IMPORTANT: Change this password after initial deployment!
  const adminEmail = 'admin@rakehclone.com'
  const adminPassword = 'admin123' // Change this in production!
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin'
    }
  })

  console.log('============================================')
  console.log('Database seeded successfully!')
  console.log('============================================')
  console.log('')
  console.log('Admin Account Created:')
  console.log('  Email:', adminEmail)
  console.log('  Password:', adminPassword)
  console.log('')
  console.log('⚠️  IMPORTANT: Change the admin password after first login!')
  console.log('============================================')
  console.log('')
  console.log('Plans created:', basicPlan.name, proPlan.name, premiumPlan.name, enterprisePlan.name)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
