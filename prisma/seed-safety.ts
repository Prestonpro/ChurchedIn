import { pathToFileURL } from 'node:url';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

export async function seedSafetyData() {
  console.log('Seeding safety test data...');
  
  // 1. Get St. Mary's church
  let church = await prisma.church.findFirst({
    where: { name: "St. Mary's" }
  });
  
  if (!church) {
    church = await prisma.church.create({
      data: {
        name: "St. Mary's",
        joinCode: "STM123",
      }
    });
    console.log("Created St. Mary's church (was missing).");
  } else {
    console.log("Found St. Mary's church.");
  }
  
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  // Test Student (Interviewee perspective)
  const testStudent = await prisma.user.upsert({
    where: { email: 'test-student@test.com' },
    update: {},
    create: {
      email: 'test-student@test.com',
      name: 'Test Student',
      passwordHash: hashedPassword,
      createdAt: new Date('2026-01-15'),
      memberships: {
        create: {
          churchId: church.id,
          role: 'STUDENT',
          createdAt: new Date('2026-01-15')
        }
      },
      studentProfile: {
        create: {
          countryOfOrigin: 'South Korea',
          school: 'Texas A&M University',
          languages: 'Korean, English',
          major: 'Computer Science',
          graduationYear: '2027',
          hobbies: 'Cooking, Photography',
          interests: 'Career advice, cultural adjustment',
          careerGoals: 'Software engineering internship',
          linkedinUrl: 'https://linkedin.com/in/test-student',
          instagramUrl: 'https://instagram.com/teststudent'
        }
      }
    }
  });
  
  console.log("Created Test Student.");

  // Volunteers data
  const volunteers = [
    {
      email: 'sarah.chen@example.com',
      name: 'Sarah Chen',
      googleId: 'google-sarah-chen-123',
      createdAt: new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000), // 8 months ago
      profile: {
        jobTitle: 'Software Engineer',
        company: 'Microsoft',
        languages: 'Korean, English',
        hobbies: 'Cooking, Photography, Hiking',
        bio: "Hi! I moved here from Korea 5 years ago and love helping students adjust. Let's grab coffee!",
        linkedinUrl: 'https://linkedin.com/in/sarahchen',
        facebookUrl: 'https://facebook.com/sarah.chen.volunteering',
        instagramUrl: 'https://instagram.com/sarahchen_'
      }
    },
    {
      email: 'david.kim@example.com',
      name: 'David Kim',
      googleId: 'google-david-kim-123',
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // 1 year ago
      profile: {
        jobTitle: 'Senior Product Manager',
        company: 'Dell Technologies',
        languages: 'Korean, English, Japanese',
        bio: 'Passionate about helping international students navigate the US tech industry.',
        linkedinUrl: 'https://linkedin.com/in/davidkim-pm',
        instagramUrl: 'https://instagram.com/davidkim_tech'
      }
    },
    {
      email: 'emily.rodriguez@example.com',
      name: 'Emily Rodriguez',
      googleId: 'google-emily-rodriguez-123',
      createdAt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 months ago
      profile: {
        jobTitle: 'Teacher',
        company: 'Bryan ISD',
        languages: 'English, Spanish',
        hobbies: 'Art, Music, Cooking',
        bio: 'I love meeting students from all over the world and learning about new cultures!',
        linkedinUrl: 'https://linkedin.com/in/emilyrodriguez-teach',
        facebookUrl: 'https://facebook.com/emily.rodriguez.teacher'
      }
    },
    {
      email: 'james.wilson@example.com',
      name: 'James Wilson',
      createdAt: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000), // 4 months ago
      profile: {
        jobTitle: 'Accountant',
        company: 'KPMG',
        languages: 'English',
        bio: 'Happy to help.',
        linkedinUrl: 'https://linkedin.com/in/jameswilson-cpa'
      }
    },
    {
      email: 'michael.brown@example.com',
      name: 'Michael Brown',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      profile: {
        languages: 'English'
      }
    },
    {
      email: 'jennifer.taylor@example.com',
      name: 'Jennifer Taylor',
      googleId: 'google-jennifer-taylor-123',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      profile: {
        jobTitle: 'Graduate Student',
        company: 'Texas A&M',
        languages: 'English, Mandarin',
        hobbies: 'Reading, traveling, board games',
        interests: 'Grad school advice, local spots',
        bio: 'I just started my PhD here and would love to meet more people!',
        instagramUrl: 'https://instagram.com/jenn.taylor'
      }
    },
    {
      email: 'robert.martinez@example.com',
      name: 'Robert Martinez',
      createdAt: new Date(Date.now() - 10 * 30 * 24 * 60 * 60 * 1000), // 10 months ago
      profile: {
        jobTitle: 'Retired',
        bio: 'Here to help.',
        languages: 'English'
      }
    },
    {
      email: 'lisa.wang@example.com',
      name: 'Lisa Wang',
      googleId: 'google-lisa-wang-123',
      createdAt: new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000), // 5 months ago
      profile: {
        jobTitle: 'Data Analyst',
        company: 'Amazon',
        languages: 'Korean, English, Mandarin',
        hobbies: 'Cooking, Gaming',
        bio: 'I came to the US as an international student 6 years ago. I know how hard the transition can be!',
        linkedinUrl: 'https://linkedin.com/in/lisawang-data',
        facebookUrl: 'https://facebook.com/lisa.wang.da',
        instagramUrl: 'https://instagram.com/lisawang_'
      }
    },
    {
      email: 'tom.harris@example.com',
      name: 'Tom Harris',
      createdAt: new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000), // 7 months ago
      profile: {
        jobTitle: 'Uber Driver',
        languages: 'English'
      }
    },
    {
      email: 'amanda.foster@example.com',
      name: 'Amanda Foster',
      googleId: 'google-amanda-foster-123',
      createdAt: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000), // 2 months ago
      profile: {
        jobTitle: 'Marketing Manager',
        company: 'HEB',
        languages: 'English, Spanish',
        hobbies: 'Fitness, running, podcasts',
        interests: 'Career prep, marketing',
        bio: 'Native Texan! Love showing students around.',
        linkedinUrl: 'https://linkedin.com/in/amandafoster-mktg',
        facebookUrl: 'https://facebook.com/amanda.foster',
        instagramUrl: 'https://instagram.com/amandafoster'
      }
    },
    {
      email: 'kevin.nguyen@example.com',
      name: 'Kevin Nguyen',
      googleId: 'google-kevin-nguyen-123',
      createdAt: new Date(Date.now() - 9 * 30 * 24 * 60 * 60 * 1000), // 9 months ago
      profile: {
        jobTitle: 'PhD Student',
        company: 'Texas A&M',
        languages: 'Vietnamese, English, Korean',
        hobbies: 'Photography, Gaming',
        bio: 'Former international undergrad, now a grad student here.',
        linkedinUrl: 'https://linkedin.com/in/kevinnguyen-phd',
        instagramUrl: 'https://instagram.com/kev.nguyen'
      }
    },
    {
      email: 'rachel.adams@example.com',
      name: 'Pastor Rachel Adams',
      googleId: 'google-rachel-adams-123',
      createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // 1 year ago
      role: 'CHURCH_ADMIN',
      profile: {
        jobTitle: 'Lead Pastor',
        company: "St. Mary's",
        languages: 'English',
        hobbies: 'Reading, theology, community building',
        interests: 'Pastoral care, mentoring',
        bio: "Lead Pastor at St. Mary's International Ministry. Welcome to our community!",
        linkedinUrl: 'https://linkedin.com/in/racheladams-pastor',
        facebookUrl: 'https://facebook.com/stmarys.ministry'
      }
    }
  ];

  const createdVolunteers: Record<string, any> = {};

  for (const vol of volunteers) {
    const { bio, ...mentorProfileData } = vol.profile;
    const user = await prisma.user.upsert({
      where: { email: vol.email },
      update: {},
      create: {
        email: vol.email,
        name: vol.name,
        passwordHash: hashedPassword,
        googleId: vol.googleId,
        createdAt: vol.createdAt,
        bio: bio,
        memberships: {
          create: {
            churchId: church.id,
            role: (vol as any).role || 'VOLUNTEER' as any,
            createdAt: vol.createdAt
          }
        },
        mentorProfile: {
          create: mentorProfileData
        }
      }
    });
    createdVolunteers[vol.name] = user;
    console.log(`Created volunteer: ${vol.name}`);
  }

  // Mentor Connections
  await prisma.mentorConnection.createMany({
    data: [
      { studentId: testStudent.id, mentorId: createdVolunteers['Sarah Chen'].id, status: 'ACCEPTED', createdAt: new Date() },
      { studentId: testStudent.id, mentorId: createdVolunteers['David Kim'].id, status: 'ACCEPTED', createdAt: new Date() },
      { studentId: testStudent.id, mentorId: createdVolunteers['Emily Rodriguez'].id, status: 'PENDING', createdAt: new Date() },
      { studentId: testStudent.id, mentorId: createdVolunteers['Robert Martinez'].id, status: 'DECLINED', createdAt: new Date() },
      { studentId: testStudent.id, mentorId: createdVolunteers['Lisa Wang'].id, status: 'PENDING', createdAt: new Date() },
      { studentId: testStudent.id, mentorId: createdVolunteers['Kevin Nguyen'].id, status: 'ACCEPTED', createdAt: new Date() },
    ],
    skipDuplicates: true
  });
  console.log("Created Mentor Connections.");

  // Events
  const events = [
    { name: 'Weekly Korean-American Dinner', type: 'DINNER', creator: 'Sarah Chen', loc: 'church' },
    { name: 'Coffee Chat: Career Advice for CS Students', type: 'COFFEE_CHAT', creator: 'David Kim', loc: 'coffee shop' },
    { name: 'Airport Pickup for New Students', type: 'AIRPORT_PICKUP', creator: 'Pastor Rachel Adams', loc: 'airport' },
    { name: 'Study Group: Algorithms', type: 'STUDY_GROUP', creator: 'Kevin Nguyen', loc: 'library' },
    { name: 'Cultural Outing: State Fair', type: 'CULTURAL_OUTING', creator: 'Emily Rodriguez', loc: 'off-campus' },
    { name: 'Holiday Celebration: Chuseok', type: 'HOLIDAY_CELEBRATION', creator: 'Lisa Wang', loc: 'church' }
  ];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const creator = createdVolunteers[ev.creator];
    const newEvent = await prisma.event.create({
      data: {
        churchId: church.id,
        createdById: creator.id,
        title: ev.name,
        description: ev.name,
        category: ev.type as any,
        startsAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // Future dates
        endsAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
        location: ev.loc
      }
    });
    
    // RSVPs for Sarah's dinner
    if (ev.name === 'Weekly Korean-American Dinner') {
      await prisma.eventRsvp.createMany({
        data: [
          { eventId: newEvent.id, userId: creator.id, role: 'HELPER' },
          { eventId: newEvent.id, userId: testStudent.id, role: 'ATTENDEE' },
          { eventId: newEvent.id, userId: createdVolunteers['David Kim'].id, role: 'HELPER' },
          { eventId: newEvent.id, userId: createdVolunteers['Emily Rodriguez'].id, role: 'HELPER' }
        ],
        skipDuplicates: true
      });
    }
    
    // Some more RSVPs for others
    if (ev.name === 'Coffee Chat: Career Advice for CS Students') {
      await prisma.eventRsvp.createMany({
        data: [
          { eventId: newEvent.id, userId: creator.id, role: 'HELPER' },
          { eventId: newEvent.id, userId: testStudent.id, role: 'ATTENDEE' }
        ],
        skipDuplicates: true
      });
    }
  }
  
  console.log("Created Events and RSVPs.");

  // Ride Requests
  await prisma.rideRequest.createMany({
    data: [
      { churchId: church.id, studentId: testStudent.id, volunteerId: createdVolunteers['Sarah Chen'].id, status: 'COMPLETED', destination: 'HEB', date: new Date(), time: "10:00 AM" },
      { churchId: church.id, studentId: testStudent.id, volunteerId: createdVolunteers['Sarah Chen'].id, status: 'COMPLETED', destination: 'Target', date: new Date(), time: "02:00 PM" },
      { churchId: church.id, studentId: createdVolunteers['Jennifer Taylor'].id, volunteerId: createdVolunteers['Tom Harris'].id, status: 'COMPLETED', destination: 'Airport', date: new Date(), time: "09:00 AM" },
      { churchId: church.id, studentId: testStudent.id, status: 'OPEN', destination: 'HEB on Texas Ave', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), time: "03:30 PM" }
    ],
    skipDuplicates: true
  });
  console.log("Created Ride Requests.");

  // Blocks
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: testStudent.id, blockedId: createdVolunteers['Michael Brown'].id } },
    update: {},
    create: {
      blockerId: testStudent.id,
      blockedId: createdVolunteers['Michael Brown'].id
    }
  });
  console.log("Created Block.");

  // Verified badges — a handful of personas marked verified so
  // interviewees can compare perceived safety with/without the badge
  // (what "verified" actually means is undecided; this only sets the
  // display flag for now). A direct update, not part of the upserts
  // above, so it also takes effect on personas that already existed from
  // an earlier run of this script.
  const verifiedNames = ['Sarah Chen', 'Pastor Rachel Adams', 'Kevin Nguyen'];
  await prisma.user.updateMany({
    where: { id: { in: verifiedNames.map((n) => createdVolunteers[n].id) } },
    data: { verified: true },
  });
  console.log('Marked verified:', verifiedNames.join(', '));

  console.log('Seeding complete!');
}

// Only auto-run when executed directly (`npx tsx prisma/seed-safety.ts`),
// not when imported as a module (e.g. by the temporary production-seed
// route) — importing must not trigger a run, and process.exit() inside a
// server route would kill the whole serverless function instance.
const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
if (isDirectRun) {
  seedSafetyData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
