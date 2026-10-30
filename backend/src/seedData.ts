/**
 * CareerBridge — Centralized Development Seed Data System
 * Hackathon: MISSION BHARAT HACKATHON | Problem Statement #07
 * 
 * Provides realistic, connected, and idempotent sample data for Tier-2/3 college
 * placement workflows (Students, Colleges, Employers, Mentors, Drives, Applications,
 * Interviews, Learning Hub, Mentorship, and Analytics).
 * 
 * Usage:
 *   npm run seed          # Idempotently upsert demo records
 *   npm run seed:reset    # Safely clear demo records and re-seed
 */

import mongoose from 'mongoose';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { hashPassword } from './utils/auth.js';
import { User } from './models/user.model.js';
import { PlacementDrive } from './models/placementDrive.model.js';
import { PlacementApplication } from './models/placementApplication.model.js';
import { Cohort } from './models/cohort.model.js';
import { Interview } from './models/interview.model.js';
import { CollegeEmployerConnection } from './models/collegeEmployerConnection.model.js';
import { CareerEvent } from './models/careerEvent.model.js';
import { Notification } from './models/notification.model.js';
import { MentorProfile } from './models/mentorProfile.model.js';
import { StudentMentorshipProfile } from './models/studentMentorshipProfile.model.js';
import { MentorshipRelationship } from './models/mentorshipRelationship.model.js';
import { MentorshipSession } from './models/mentorshipSession.model.js';
import { LearningHubService } from './services/learningHub.service.js';
import { AssessmentAttempt } from './models/assessmentAttempt.model.js';
import { AuditLog } from './models/auditLog.model.js';

// Environment Protection Check
if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ CRITICAL: Seed data script cannot be executed in a production environment!');
  process.exit(1);
}

const isResetMode = process.argv.includes('--reset');
const DEMO_PASSWORD = 'DemoPass@123';
const DEMO_EMAIL_DOMAIN = '@careerbridge.demo';

interface SeedMetrics {
  usersCreated: number;
  usersUpdated: number;
  collegesSeeded: number;
  employersSeeded: number;
  drivesSeeded: number;
  applicationsSeeded: number;
  interviewsSeeded: number;
  cohortsSeeded: number;
  mentorshipSeeded: number;
  eventsSeeded: number;
  notificationsSeeded: number;
}

const metrics: SeedMetrics = {
  usersCreated: 0,
  usersUpdated: 0,
  collegesSeeded: 0,
  employersSeeded: 0,
  drivesSeeded: 0,
  applicationsSeeded: 0,
  interviewsSeeded: 0,
  cohortsSeeded: 0,
  mentorshipSeeded: 0,
  eventsSeeded: 0,
  notificationsSeeded: 0,
};

async function seedDatabase(): Promise<void> {
  console.log('====================================================');
  console.log('🌱 CareerBridge Development Seed Data System');
  console.log(`🌍 Target Database: ${config.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
  console.log(`🔄 Mode: ${isResetMode ? 'RESET & SEED' : 'IDEMPOTENT UPSERT'}`);
  console.log('====================================================\n');

  const connected = await connectDatabase();
  if (!connected) {
    console.warn('[Seed] Warning: MongoDB connection unavailable. Operating in offline/validation mode.');
    return;
  }

  try {
    const passwordHash = await hashPassword(DEMO_PASSWORD);

    // ==========================================
    // 0. RESET STAGE (If --reset flag passed)
    // ==========================================
    if (isResetMode) {
      console.log('🧹 [Reset] Removing previous demo records (@careerbridge.demo)...');
      
      const demoUsers = await User.find({ email: { $regex: `${DEMO_EMAIL_DOMAIN}$`, $options: 'i' } });
      const demoUserIds = demoUsers.map((u) => u._id);

      await PlacementApplication.deleteMany({ studentId: { $in: demoUserIds } });
      await PlacementDrive.deleteMany({ createdBy: { $in: demoUserIds } });
      await Interview.deleteMany({ studentId: { $in: demoUserIds } });
      await Cohort.deleteMany({ collegeId: { $in: demoUserIds } });
      await CollegeEmployerConnection.deleteMany({
        $or: [{ collegeId: { $in: demoUserIds } }, { employerId: { $in: demoUserIds } }],
      });
      await MentorProfile.deleteMany({ userId: { $in: demoUserIds } });
      await StudentMentorshipProfile.deleteMany({ studentId: { $in: demoUserIds } });
      await MentorshipRelationship.deleteMany({
        $or: [{ studentId: { $in: demoUserIds } }, { mentorId: { $in: demoUserIds } }],
      });
      await MentorshipSession.deleteMany({
        $or: [{ studentId: { $in: demoUserIds } }, { mentorId: { $in: demoUserIds } }],
      });
      await CareerEvent.deleteMany({ organizerId: { $in: demoUserIds } });
      await Notification.deleteMany({ recipientId: { $in: demoUserIds } });
      await AssessmentAttempt.deleteMany({ studentId: { $in: demoUserIds } });
      await User.deleteMany({ _id: { $in: demoUserIds } });

      console.log(`   Cleaned up ${demoUserIds.length} demo user records and associated dependencies.\n`);
    }

    // ==========================================
    // 1. ADMIN USER
    // ==========================================
    console.log('👑 [1/8] Seeding Platform Administrators...');
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@careerbridge.demo' },
      {
        fullName: 'Dr. Rameshwar Joshi (Admin Demo)',
        passwordHash,
        role: 'ADMIN',
        preferredLanguage: 'en',
        phoneNumber: '+91 9820011223',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    metrics.usersCreated++;

    // ==========================================
    // 2. COLLEGE USERS (Tier-2/3 Institutions)
    // ==========================================
    console.log('🏫 [2/8] Seeding Grassroots Partner Colleges...');
    const college1User = await User.findOneAndUpdate(
      { email: 'college01@careerbridge.demo' },
      {
        fullName: 'Prof. Anant Kulkarni (TPO Lead)',
        passwordHash,
        role: 'COLLEGE',
        preferredLanguage: 'en',
        phoneNumber: '+91 9822100441',
        isActive: true,
        collegeProfile: {
          institutionName: 'Swami Vivekananda Rural Institute of Technology (Demo College)',
          institutionCode: 'SVRIT-MH-042',
          institutionType: 'ENGINEERING',
          state: 'Maharashtra',
          district: 'Kolhapur',
          city: 'Kolhapur',
          pincode: '416004',
          affiliatedUniversity: 'Dr. Babasaheb Ambedkar Technological University (DBATU), Lonere',
          establishedYear: 2008,
          totalStudentsEnrolled: 1250,
          placementCellStatus: 'INACTIVE',
          spocName: 'Prof. Anant Kulkarni',
          spocDesignation: 'Assistant Professor & Faculty Placement In-charge',
          spocEmail: 'college01@careerbridge.demo',
          spocPhone: '+91 9822100441',
          departments: ['Computer Science', 'Information Technology', 'Mechanical Engineering', 'Electrical Engineering'],
          degreePrograms: ['B.Tech', 'Diploma'],
          campusAddress: 'Gat No. 142, Shiroli Industrial Corridor, Kolhapur, Maharashtra',
          accreditationStatus: 'NAAC_B',
          verificationStatus: 'VERIFIED',
        },
      },
      { upsert: true, new: true }
    );
    metrics.collegesSeeded++;
    metrics.usersCreated++;

    const college2User = await User.findOneAndUpdate(
      { email: 'college02@careerbridge.demo' },
      {
        fullName: 'Dr. Sunita Gaikwad (Faculty Coordinator)',
        passwordHash,
        role: 'COLLEGE',
        preferredLanguage: 'en',
        phoneNumber: '+91 9423551122',
        isActive: true,
        collegeProfile: {
          institutionName: 'Dr. A.P.J. Abdul Kalam Regional Engineering College (Demo College)',
          institutionCode: 'AKREC-MH-118',
          institutionType: 'ENGINEERING',
          state: 'Maharashtra',
          district: 'Nanded',
          city: 'Nanded',
          pincode: '431606',
          affiliatedUniversity: 'Swami Ramanand Teerth Marathwada University (SRTMUN), Nanded',
          establishedYear: 2012,
          totalStudentsEnrolled: 890,
          placementCellStatus: 'NONE',
          spocName: 'Dr. Sunita Gaikwad',
          spocDesignation: 'Head of Computer Engineering & Placement Coordinator',
          spocEmail: 'college02@careerbridge.demo',
          spocPhone: '+91 9423551122',
          departments: ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication'],
          degreePrograms: ['B.Tech'],
          campusAddress: 'Survey No. 45, Airport Road, Nanded, Maharashtra',
          accreditationStatus: 'STATE_APPROVED',
          verificationStatus: 'VERIFIED',
        },
      },
      { upsert: true, new: true }
    );
    metrics.collegesSeeded++;
    metrics.usersCreated++;

    // ==========================================
    // 3. EMPLOYER USERS & PROFILES
    // ==========================================
    console.log('💼 [3/8] Seeding National Recruiters & Employers...');
    const employer1User = await User.findOneAndUpdate(
      { email: 'employer01@careerbridge.demo' },
      {
        fullName: 'Kavita Menon (Talent Acquisition Lead)',
        passwordHash,
        role: 'EMPLOYER',
        preferredLanguage: 'en',
        phoneNumber: '+91 9811223344',
        isActive: true,
        employerProfile: {
          organizationName: 'ZenithPay Technologies (Demo FinTech)',
          organizationType: 'PRODUCT',
          industry: 'FinTech & Payments Infrastructure',
          companySize: '500-1000',
          headquartersLocation: 'Bengaluru, Karnataka (Offices in Pune)',
          websiteUrl: 'https://zenithpay.demo.mock',
          linkedinUrl: 'https://linkedin.com/company/zenithpay-demo',
          companyDescription:
            'Next-generation merchant settlement and unified payments API platform supporting 40M+ daily financial transactions across Bharat.',
          hiringLocations: ['Pune', 'Bengaluru', 'Hybrid'],
          tier2Tier3HiringFocus: true,
          verificationStatus: 'VERIFIED',
          recruiterName: 'Kavita Menon',
          recruiterDesignation: 'Lead University Talent Partner',
          recruiterEmail: 'employer01@careerbridge.demo',
          recruiterPhone: '+91 9811223344',
          activeDrivesCount: 2,
        },
      },
      { upsert: true, new: true }
    );
    metrics.employersSeeded++;
    metrics.usersCreated++;

    const employer2User = await User.findOneAndUpdate(
      { email: 'employer02@careerbridge.demo' },
      {
        fullName: 'Rahul Verma (Engineering Hiring Manager)',
        passwordHash,
        role: 'EMPLOYER',
        preferredLanguage: 'en',
        phoneNumber: '+91 9833445566',
        isActive: true,
        employerProfile: {
          organizationName: 'CogniCraft AI Labs (Demo AI)',
          organizationType: 'STARTUP',
          industry: 'Artificial Intelligence & Machine Learning',
          companySize: '100-250',
          headquartersLocation: 'Pune, Maharashtra',
          websiteUrl: 'https://cognicraft.demo.mock',
          linkedinUrl: 'https://linkedin.com/company/cognicraft-demo',
          companyDescription:
            'Building domain-specific generative AI copilot solutions for enterprise workflows, NLP text extraction, and automated telemetry.',
          hiringLocations: ['Pune', 'Remote'],
          tier2Tier3HiringFocus: true,
          verificationStatus: 'VERIFIED',
          recruiterName: 'Rahul Verma',
          recruiterDesignation: 'VP of Engineering & Head of Campus Recruitment',
          recruiterEmail: 'employer02@careerbridge.demo',
          recruiterPhone: '+91 9833445566',
          activeDrivesCount: 1,
        },
      },
      { upsert: true, new: true }
    );
    metrics.employersSeeded++;
    metrics.usersCreated++;

    const employer3User = await User.findOneAndUpdate(
      { email: 'employer03@careerbridge.demo' },
      {
        fullName: 'Priyanka Sen (HR Director)',
        passwordHash,
        role: 'EMPLOYER',
        preferredLanguage: 'en',
        phoneNumber: '+91 9911887766',
        isActive: true,
        employerProfile: {
          organizationName: 'ApexLogic Software Systems (Demo IT)',
          organizationType: 'SERVICES',
          industry: 'Cloud Solutions & Product Engineering',
          companySize: '1000-5000',
          headquartersLocation: 'Hyderabad, Telangana',
          websiteUrl: 'https://apexlogic.demo.mock',
          linkedinUrl: 'https://linkedin.com/company/apexlogic-demo',
          companyDescription:
            'Global digital transformation consultancy delivering cloud modernization, full-stack microservices, and automated testing services.',
          hiringLocations: ['Hyderabad', 'Pune', 'Bengaluru'],
          tier2Tier3HiringFocus: true,
          verificationStatus: 'VERIFIED',
          recruiterName: 'Priyanka Sen',
          recruiterDesignation: 'Director — Early Careers & Campus Talent',
          recruiterEmail: 'employer03@careerbridge.demo',
          recruiterPhone: '+91 9911887766',
          activeDrivesCount: 1,
        },
      },
      { upsert: true, new: true }
    );
    metrics.employersSeeded++;
    metrics.usersCreated++;

    // ==========================================
    // 4. STUDENT USERS & PROFILES
    // ==========================================
    console.log('🎓 [4/8] Seeding Verified Student Talent Profiles...');
    const student1User = await User.findOneAndUpdate(
      { email: 'student01@careerbridge.demo' },
      {
        fullName: 'Aarav Sharma (Student Demo)',
        passwordHash,
        role: 'STUDENT',
        preferredLanguage: 'en',
        phoneNumber: '+91 9765432101',
        isActive: true,
        studentProfile: {
          collegeName: 'Swami Vivekananda Rural Institute of Technology (Demo College)',
          educationLevel: 'B.Tech',
          course: 'Computer Science and Engineering',
          specialization: 'Full Stack Web & Distributed Systems',
          graduationYear: 2026,
          cgpa: 8.7,
          backlogs: 0,
          headline: 'Full-Stack Developer | React, TypeScript, Node.js & Distributed Architecture',
          careerObjective:
            'Aspiring Software Engineer passionate about scalable backend architecture and responsive UI systems. Actively developing production-ready web applications from a Tier-3 rural college.',
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Git', 'Docker'],
          technicalSkills: ['TypeScript', 'React.js', 'Node.js', 'REST APIs', 'PostgreSQL', 'Docker', 'Tailwind CSS'],
          softSkills: ['Problem Solving', 'Team Collaboration', 'Technical Documentation', 'Agile Mindset'],
          careerInterests: ['Full-Stack Development', 'Backend Engineering', 'Cloud Native Apps'],
          preferredWorkLocation: ['Pune', 'Bengaluru', 'Remote'],
          preferredJobRoles: ['Associate Software Engineer', 'Full-Stack Developer', 'Frontend Engineer'],
          workModePreference: 'HYBRID',
          profileCompletionScore: 95,
          githubUrl: 'https://github.com/aaravsharma-demo',
          linkedinUrl: 'https://linkedin.com/in/aaravsharma-demo',
          portfolioUrl: 'https://aaravsharma.demo.me',
          educationHistory: [
            {
              institution: 'Swami Vivekananda Rural Institute of Technology',
              degree: 'B.Tech in Computer Science and Engineering',
              fieldOfStudy: 'Computer Engineering',
              startYear: 2022,
              endYear: 2026,
              cgpa: 8.7,
              isCurrent: true,
            },
          ],
          projects: [
            {
              id: 'proj-1',
              title: 'Agrimart — Direct Farmers to Consumer Marketplace',
              description:
                'Full-stack platform enabling local sugarcane and vegetable farmers in rural Maharashtra to sell directly to regional distributors. Includes multilingual SMS alerts and offline order caching.',
              technologies: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'PWA'],
              role: 'Sole Full-Stack Developer',
              duration: '3 months',
              githubUrl: 'https://github.com/aaravsharma-demo/agrimart',
              liveDemoUrl: 'https://agrimart.demo.mock',
              visibility: 'PUBLIC',
            },
            {
              id: 'proj-2',
              title: 'MicroPay — Offline-First Payment QR Engine',
              description:
                'Low-latency lightweight payments verification tool for vendors experiencing intermittent rural 2G/3G network conditions.',
              technologies: ['TypeScript', 'Express', 'Redis', 'WebSockets'],
              role: 'Backend Architect',
              duration: '2 months',
              githubUrl: 'https://github.com/aaravsharma-demo/micropay',
              visibility: 'PUBLIC',
            },
          ],
          certifications: [
            {
              id: 'cert-1',
              title: 'Meta Frontend Developer Professional Certificate',
              issuer: 'Coursera / Meta',
              issueDate: '2025-06-15',
              credentialId: 'META-FE-98442',
            },
          ],
        },
      },
      { upsert: true, new: true }
    );
    metrics.usersCreated++;

    const student2User = await User.findOneAndUpdate(
      { email: 'student02@careerbridge.demo' },
      {
        fullName: 'Pooja Deshmukh (Student Demo)',
        passwordHash,
        role: 'STUDENT',
        preferredLanguage: 'hi',
        phoneNumber: '+91 9765432102',
        isActive: true,
        studentProfile: {
          collegeName: 'Dr. A.P.J. Abdul Kalam Regional Engineering College (Demo College)',
          educationLevel: 'B.Tech',
          course: 'Information Technology',
          specialization: 'Artificial Intelligence & Data Engineering',
          graduationYear: 2025,
          cgpa: 8.4,
          backlogs: 0,
          headline: 'Data Engineer & Python Developer | ML Pipelines & Statistical Modeling',
          careerObjective:
            'Final-year IT undergraduate dedicated to building automated data transformation pipelines and deployable machine learning services for data-driven enterprises.',
          skills: ['Python', 'SQL', 'FastAPI', 'Pandas', 'NumPy', 'Scikit-Learn', 'Docker', 'AWS'],
          technicalSkills: ['Python', 'SQL', 'FastAPI', 'PyTorch', 'Data Pipelines', 'Git', 'Linux'],
          softSkills: ['Analytical Reasoning', 'Communication', 'Adaptability'],
          careerInterests: ['Data Engineering', 'Machine Learning', 'Python Backend'],
          preferredWorkLocation: ['Pune', 'Hyderabad', 'Bengaluru'],
          preferredJobRoles: ['Junior Data Engineer', 'Python Backend Developer', 'AI Associate'],
          workModePreference: 'ONSITE',
          profileCompletionScore: 90,
          githubUrl: 'https://github.com/poojadeshmukh-demo',
          linkedinUrl: 'https://linkedin.com/in/poojadeshmukh-demo',
          educationHistory: [
            {
              institution: 'Dr. A.P.J. Abdul Kalam Regional Engineering College',
              degree: 'B.Tech in Information Technology',
              fieldOfStudy: 'Information Technology',
              startYear: 2021,
              endYear: 2025,
              cgpa: 8.4,
              isCurrent: true,
            },
          ],
          projects: [
            {
              id: 'proj-3',
              title: 'CropYield AI — Climate Resilient Harvest Forecaster',
              description:
                'Machine learning pipeline ingesting satellite weather telemetry and soil sensor feeds to predict localized crop yield in the Marathwada district with 89% accuracy.',
              technologies: ['Python', 'FastAPI', 'RandomForest', 'Pandas', 'Streamlit'],
              role: 'ML Developer',
              duration: '4 months',
              githubUrl: 'https://github.com/poojadeshmukh-demo/cropyield-ai',
              visibility: 'PUBLIC',
            },
          ],
        },
      },
      { upsert: true, new: true }
    );
    metrics.usersCreated++;

    const student3User = await User.findOneAndUpdate(
      { email: 'student03@careerbridge.demo' },
      {
        fullName: 'Rohan Patil (Student Demo)',
        passwordHash,
        role: 'STUDENT',
        preferredLanguage: 'en',
        phoneNumber: '+91 9765432103',
        isActive: true,
        studentProfile: {
          collegeName: 'Swami Vivekananda Rural Institute of Technology (Demo College)',
          educationLevel: 'B.Tech',
          course: 'Computer Science and Engineering',
          specialization: 'Cloud DevOps & Systems Programming',
          graduationYear: 2026,
          cgpa: 7.9,
          backlogs: 0,
          headline: 'Cloud & DevOps Enthusiast | Linux, Docker, CI/CD & Go',
          careerObjective:
            'Motivated engineering student with hands-on practice in containerization, continuous integration, and infrastructure automation.',
          skills: ['Linux', 'Docker', 'Kubernetes Basics', 'Go', 'Bash', 'Git', 'Python', 'Terraform Basics'],
          technicalSkills: ['Docker', 'Linux Administration', 'Go', 'GitHub Actions', 'Nginx', 'Prometheus'],
          softSkills: ['Teamwork', 'Quick Learner', 'Problem Solving'],
          careerInterests: ['DevOps Engineering', 'Cloud Infrastructure', 'Site Reliability'],
          preferredWorkLocation: ['Pune', 'Bengaluru'],
          preferredJobRoles: ['Associate DevOps Engineer', 'Cloud Operations Trainee'],
          workModePreference: 'ANY',
          profileCompletionScore: 85,
        },
      },
      { upsert: true, new: true }
    );
    metrics.usersCreated++;

    const student4User = await User.findOneAndUpdate(
      { email: 'student04@careerbridge.demo' },
      {
        fullName: 'Sneha Kulkarni (Student Demo)',
        passwordHash,
        role: 'STUDENT',
        preferredLanguage: 'en',
        phoneNumber: '+91 9765432104',
        isActive: true,
        studentProfile: {
          collegeName: 'Dr. A.P.J. Abdul Kalam Regional Engineering College (Demo College)',
          educationLevel: 'B.Tech',
          course: 'Computer Engineering',
          specialization: 'Core Algorithms & Backend Engineering',
          graduationYear: 2025,
          cgpa: 9.1,
          backlogs: 0,
          headline: 'Backend Engineer | Java, Spring Boot, MySQL & Distributed Caching',
          careerObjective:
            'Top academic rank holder focusing on clean architecture, design patterns, and high-throughput transaction processing.',
          skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Kafka Basics', 'JUnit', 'Hibernate', 'Git'],
          technicalSkills: ['Java', 'Spring Boot', 'Microservices', 'MySQL', 'REST APIs', 'Hibernate'],
          softSkills: ['Communication', 'Critical Thinking', 'Leadership'],
          careerInterests: ['Backend Development', 'Enterprise Software', 'FinTech'],
          preferredWorkLocation: ['Hyderabad', 'Pune', 'Bengaluru'],
          preferredJobRoles: ['Junior Software Engineer', 'Java Backend Developer'],
          workModePreference: 'ONSITE',
          profileCompletionScore: 92,
        },
      },
      { upsert: true, new: true }
    );
    metrics.usersCreated++;

    // ==========================================
    // 5. MENTOR USERS & PROFILES
    // ==========================================
    console.log('🤝 [5/8] Seeding Industry Mentors & Alumni...');
    const mentor1User = await User.findOneAndUpdate(
      { email: 'mentor01@careerbridge.demo' },
      {
        fullName: 'Vikramaditya Rao (Alumni Mentor Demo)',
        passwordHash,
        role: 'MENTOR',
        preferredLanguage: 'en',
        phoneNumber: '+91 9877001122',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    metrics.usersCreated++;

    const mentor1Profile = await MentorProfile.findOneAndUpdate(
      { userId: mentor1User._id },
      {
        userId: mentor1User._id,
        organization: 'Tier-1 Cloud Scalers Pvt Ltd',
        designation: 'Staff Software Engineer (Backend Systems)',
        experienceYears: 11,
        industry: 'Cloud Infrastructure & High-Volume Distributed Systems',
        expertise: ['System Design', 'Backend Architecture', 'Distributed Systems', 'Interview Preparation', 'Go', 'Kubernetes'],
        mentorshipTopics: ['Campus-to-Corporate Transition', 'System Design Foundations', 'Resume Architecture', 'Technical Interview Mastery'],
        bio: 'Originally graduated from a rural engineering college in Maharashtra. Over the past 11 years, engineered systems scaling to 100M+ requests. Passionate about empowering Tier-2/3 engineers with pragmatic corporate playbooks.',
        languages: ['English', 'Hindi', 'Marathi'],
        isAlumni: true,
        almaMaterCollegeId: college1User._id,
        almaMaterCollegeName: 'Swami Vivekananda Rural Institute of Technology',
        graduationYear: 2014,
        branch: 'Computer Science',
        maximumMentees: 5,
        activeMenteeCount: 1,
        verificationStatus: 'VERIFIED',
        availableDays: ['Saturday', 'Sunday'],
        timeSlots: [
          { day: 'Saturday', startTime: '16:00', endTime: '17:00', timezone: 'Asia/Kolkata' },
          { day: 'Sunday', startTime: '11:00', endTime: '12:00', timezone: 'Asia/Kolkata' },
        ],
        ratingAverage: 4.9,
        totalReviews: 24,
        totalSessionsCompleted: 42,
      },
      { upsert: true, new: true }
    );
    metrics.mentorshipSeeded++;

    // Mentorship Relationship: Student 1 with Mentor 1
    const mentorshipRel = await MentorshipRelationship.findOneAndUpdate(
      { studentId: student1User._id, mentorId: mentor1User._id },
      {
        studentId: student1User._id,
        mentorId: mentor1User._id,
        mentorProfileId: mentor1Profile._id,
        topic: 'System Design & High-Throughput Web Services',
        primaryObjective: 'Transition from single-node Express apps to production-grade distributed microservices.',
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        completedSessions: 2,
        totalGoals: 3,
        completedGoals: 2,
        overallProgress: 66,
      },
      { upsert: true, new: true }
    );

    // Seed Completed Mentorship Session
    await MentorshipSession.findOneAndUpdate(
      { relationshipId: mentorshipRel._id, title: 'Session 1: Production Code Review & Resume Architecture' },
      {
        relationshipId: mentorshipRel._id,
        mentorId: mentor1User._id,
        studentId: student1User._id,
        title: 'Session 1: Production Code Review & Resume Architecture',
        sessionTopic: 'Code Structure, Clean Interfaces, and ATS Optimization',
        scheduledStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        durationMinutes: 45,
        sessionType: 'ONE_ON_ONE',
        meetingLink: 'https://meet.careerbridge.demo/room-svrit-01',
        status: 'COMPLETED',
        agenda: ['Review Agrimart code repository', 'Refactor DB connection pooling', 'Optimize technical skills layout'],
      },
      { upsert: true }
    );

    // ==========================================
    // 6. COHORTS (College Student Groups)
    // ==========================================
    console.log('👥 [6/8] Seeding Institutional Placement Cohorts...');
    await Cohort.findOneAndUpdate(
      { collegeId: college1User._id, name: 'Batch 2026 — CS/IT Placement Readiness Cohort' },
      {
        collegeId: college1User._id,
        name: 'Batch 2026 — CS/IT Placement Readiness Cohort',
        description: 'Final & pre-final year computer engineering undergraduates trained for national off-campus hiring drives.',
        academicYear: '2025-2026',
        course: 'Computer Science and Engineering',
        graduationYear: 2026,
        status: 'ACTIVE',
        studentIds: [student1User._id, student3User._id],
      },
      { upsert: true }
    );
    metrics.cohortsSeeded++;

    await Cohort.findOneAndUpdate(
      { collegeId: college2User._id, name: 'Batch 2025 — Fast-Track Enterprise Cohort' },
      {
        collegeId: college2User._id,
        name: 'Batch 2025 — Fast-Track Enterprise Cohort',
        description: 'Final-year candidates verified for instant deployment into corporate software engineering roles.',
        academicYear: '2024-2025',
        course: 'Information Technology',
        graduationYear: 2025,
        status: 'ACTIVE',
        studentIds: [student2User._id, student4User._id],
      },
      { upsert: true }
    );
    metrics.cohortsSeeded++;

    // ==========================================
    // 7. PLACEMENT DRIVES & OPPORTUNITIES
    // ==========================================
    console.log('🚀 [7/8] Seeding Recruitment Drives & Connected Applications...');
    const drive1 = await PlacementDrive.findOneAndUpdate(
      { organizationName: 'ZenithPay Technologies (Demo FinTech)', title: 'Associate Full-Stack Software Engineer (2025/2026)' },
      {
        title: 'Associate Full-Stack Software Engineer (2025/2026)',
        description:
          'Join our core transaction engineering team. You will build resilient frontend portals and mission-critical payment services processing millions in transactions daily. Open to all accredited Tier-2/3 colleges in Maharashtra & Karnataka.',
        organizationName: 'ZenithPay Technologies (Demo FinTech)',
        employerId: employer1User._id,
        createdBy: employer1User._id,
        opportunityType: 'FULL_TIME',
        workMode: 'HYBRID',
        location: 'Pune / Bengaluru',
        eligibleCourses: ['B.Tech', 'B.E.', 'MCA'],
        eligibleBranches: ['Computer Science', 'Information Technology', 'Electronics'],
        eligibleGraduationYears: [2025, 2026],
        requiredSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL'],
        preferredSkills: ['PostgreSQL', 'Docker', 'RESTful APIs'],
        minimumQualification: 'B.Tech / B.E.',
        minimumCGPA: 7.0,
        maxBacklogsAllowed: 0,
        salaryRange: '₹6.5 LPA - ₹8.5 LPA',
        numberOfOpenings: 12,
        recruitmentProcess: ['Online Technical Assessment', 'Live Coding & System Discussion', 'HR & Culture Round'],
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
      { upsert: true, new: true }
    );
    metrics.drivesSeeded++;

    const drive2 = await PlacementDrive.findOneAndUpdate(
      { organizationName: 'CogniCraft AI Labs (Demo AI)', title: 'Junior AI & Data Platform Engineer' },
      {
        title: 'Junior AI & Data Platform Engineer',
        description:
          'Work alongside seasoned AI researchers to clean, transform, and evaluate proprietary datasets for enterprise LLM fine-tuning. Opportunity for rapid growth in high-demand GenAI engineering.',
        organizationName: 'CogniCraft AI Labs (Demo AI)',
        employerId: employer2User._id,
        createdBy: employer2User._id,
        opportunityType: 'FULL_TIME',
        workMode: 'ONSITE',
        location: 'Pune, Maharashtra',
        eligibleCourses: ['B.Tech', 'B.E.', 'M.Tech'],
        eligibleBranches: ['Information Technology', 'Computer Science', 'Data Science'],
        eligibleGraduationYears: [2025],
        requiredSkills: ['Python', 'SQL', 'FastAPI', 'Pandas'],
        preferredSkills: ['PyTorch', 'Docker', 'NLP'],
        minimumCGPA: 7.5,
        maxBacklogsAllowed: 0,
        salaryRange: '₹6.0 LPA - ₹7.5 LPA',
        numberOfOpenings: 5,
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
      { upsert: true, new: true }
    );
    metrics.drivesSeeded++;

    const drive3 = await PlacementDrive.findOneAndUpdate(
      { organizationName: 'ApexLogic Software Systems (Demo IT)', title: 'Graduate Software Engineer Trainee' },
      {
        title: 'Graduate Software Engineer Trainee',
        description:
          'Comprehensive 6-month structured training followed by client project deployment. Perfect stepping stone for ambitious freshers wanting solid foundations in Java, Cloud and Enterprise DevOps.',
        organizationName: 'ApexLogic Software Systems (Demo IT)',
        employerId: employer3User._id,
        createdBy: employer3User._id,
        opportunityType: 'FULL_TIME',
        workMode: 'ONSITE',
        location: 'Hyderabad / Pune',
        eligibleCourses: ['B.Tech', 'B.E.', 'MCA', 'B.Sc Computer Science'],
        eligibleBranches: ['Computer Science', 'Information Technology', 'Circuit Branches'],
        eligibleGraduationYears: [2025, 2026],
        requiredSkills: ['Java', 'SQL', 'Git', 'Problem Solving'],
        preferredSkills: ['Spring Boot', 'Linux'],
        minimumCGPA: 6.5,
        maxBacklogsAllowed: 1,
        salaryRange: '₹4.5 LPA - ₹5.8 LPA',
        numberOfOpenings: 25,
        applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
      { upsert: true, new: true }
    );
    metrics.drivesSeeded++;

    const drive4 = await PlacementDrive.findOneAndUpdate(
      { organizationName: 'CogniCraft AI Labs (Demo AI)', title: 'Frontend React Engineering Intern (Paid)' },
      {
        title: 'Frontend React Engineering Intern (Paid)',
        description:
          '6-month high-impact paid internship crafting modern conversational UI widgets and interactive dashboards. Converts to full-time role upon graduation based on performance.',
        organizationName: 'CogniCraft AI Labs (Demo AI)',
        employerId: employer2User._id,
        createdBy: employer2User._id,
        opportunityType: 'INTERNSHIP',
        workMode: 'REMOTE',
        location: 'Remote (India)',
        eligibleCourses: ['B.Tech', 'Diploma', 'BCA', 'B.Sc'],
        eligibleBranches: ['Any Technical Branch'],
        eligibleGraduationYears: [2025, 2026],
        requiredSkills: ['JavaScript', 'React', 'HTML/CSS'],
        salaryRange: '₹25,000 / month stipend',
        internshipDuration: '6 Months',
        numberOfOpenings: 4,
        applicationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
      { upsert: true, new: true }
    );
    metrics.drivesSeeded++;

    // ==========================================
    // 8. CONNECTED APPLICATIONS & REAL PLACEMENTS
    // ==========================================
    // Rule: An application must satisfy conditions before reaching placement.

    // Student 1 -> Drive 1: FULL PIPELINE -> SELECTED (Placement condition met!)
    const app1 = await PlacementApplication.findOneAndUpdate(
      { driveId: drive1._id, studentId: student1User._id },
      {
        driveId: drive1._id,
        studentId: student1User._id,
        collegeId: college1User._id,
        status: 'SELECTED',
        appliedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        statusHistory: [
          {
            fromStatus: 'APPLIED',
            toStatus: 'SHORTLISTED',
            changedBy: employer1User._id,
            changedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
            note: 'Strong portfolio projects and 8.7 CGPA.',
          },
          {
            fromStatus: 'SHORTLISTED',
            toStatus: 'INTERVIEW_SCHEDULED',
            changedBy: employer1User._id,
            changedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            note: 'Scheduled for Technical Round 1.',
          },
          {
            fromStatus: 'INTERVIEW_SCHEDULED',
            toStatus: 'SELECTED',
            changedBy: employer1User._id,
            changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            note: 'Outstanding technical round and culture fit. Official offer letter dispatched.',
          },
        ],
      },
      { upsert: true, new: true }
    );
    metrics.applicationsSeeded++;

    // Interview for App 1 (Completed)
    await Interview.findOneAndUpdate(
      { applicationId: app1._id, interviewRound: 'Technical Interview Round 1' },
      {
        applicationId: app1._id,
        driveId: drive1._id,
        employerId: employer1User._id,
        studentId: student1User._id,
        interviewRound: 'Technical Interview Round 1',
        interviewType: 'ONLINE_VIDEO',
        scheduledAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        durationMinutes: 45,
        meetingLink: 'https://meet.careerbridge.demo/zenithpay-tech-01',
        instructions: 'Please be ready with your Agrimart codebase and live code environment.',
        status: 'COMPLETED',
        createdBy: employer1User._id,
      },
      { upsert: true }
    );
    metrics.interviewsSeeded++;

    // Student 2 -> Drive 2: INTERVIEW_SCHEDULED stage
    const app2 = await PlacementApplication.findOneAndUpdate(
      { driveId: drive2._id, studentId: student2User._id },
      {
        driveId: drive2._id,
        studentId: student2User._id,
        collegeId: college2User._id,
        status: 'INTERVIEW_SCHEDULED',
        appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        statusHistory: [
          {
            fromStatus: 'APPLIED',
            toStatus: 'SHORTLISTED',
            changedBy: employer2User._id,
            changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            note: 'Relevant Python ML projects match dataset transformation needs.',
          },
          {
            fromStatus: 'SHORTLISTED',
            toStatus: 'INTERVIEW_SCHEDULED',
            changedBy: employer2User._id,
            changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            note: 'Technical live interview scheduled.',
          },
        ],
      },
      { upsert: true, new: true }
    );
    metrics.applicationsSeeded++;

    // Upcoming Interview for App 2
    await Interview.findOneAndUpdate(
      { applicationId: app2._id, interviewRound: 'Technical Live Coding Round' },
      {
        applicationId: app2._id,
        driveId: drive2._id,
        employerId: employer2User._id,
        studentId: student2User._id,
        interviewRound: 'Technical Live Coding Round',
        interviewType: 'ONLINE_VIDEO',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        durationMinutes: 60,
        meetingLink: 'https://meet.careerbridge.demo/cognicraft-live-02',
        instructions: 'Prepare Python algorithms and SQL aggregation queries.',
        status: 'SCHEDULED',
        createdBy: employer2User._id,
      },
      { upsert: true }
    );
    metrics.interviewsSeeded++;

    // Student 4 -> Drive 3: FULL PIPELINE -> SELECTED (Placement condition met!)
    const app3 = await PlacementApplication.findOneAndUpdate(
      { driveId: drive3._id, studentId: student4User._id },
      {
        driveId: drive3._id,
        studentId: student4User._id,
        collegeId: college2User._id,
        status: 'SELECTED',
        appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        statusHistory: [
          {
            fromStatus: 'APPLIED',
            toStatus: 'SHORTLISTED',
            changedBy: employer3User._id,
            changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            note: '9.1 CGPA and solid Java / Spring background.',
          },
          {
            fromStatus: 'SHORTLISTED',
            toStatus: 'SELECTED',
            changedBy: employer3User._id,
            changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            note: 'Excellent performance in assessment and technical panel. Candidate selected.',
          },
        ],
      },
      { upsert: true, new: true }
    );
    metrics.applicationsSeeded++;

    // Student 3 -> Drive 1: SHORTLISTED
    await PlacementApplication.findOneAndUpdate(
      { driveId: drive1._id, studentId: student3User._id },
      {
        driveId: drive1._id,
        studentId: student3User._id,
        collegeId: college1User._id,
        status: 'SHORTLISTED',
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        statusHistory: [
          {
            fromStatus: 'APPLIED',
            toStatus: 'SHORTLISTED',
            changedBy: employer1User._id,
            changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            note: 'Linux and Docker foundation verified for junior infrastructure openings.',
          },
        ],
      },
      { upsert: true }
    );
    metrics.applicationsSeeded++;

    // Student 1 -> Drive 4: APPLIED
    await PlacementApplication.findOneAndUpdate(
      { driveId: drive4._id, studentId: student1User._id },
      {
        driveId: drive4._id,
        studentId: student1User._id,
        collegeId: college1User._id,
        status: 'APPLIED',
        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        statusHistory: [],
      },
      { upsert: true }
    );
    metrics.applicationsSeeded++;

    // College <-> Employer Connections
    await CollegeEmployerConnection.findOneAndUpdate(
      { collegeId: college1User._id, employerId: employer1User._id },
      {
        collegeId: college1User._id,
        employerId: employer1User._id,
        initiatedBy: 'EMPLOYER',
        message: 'ZenithPay is actively hiring 2025/2026 CS graduates from Kolhapur district.',
        status: 'ACCEPTED',
        reviewedBy: college1User._id,
        reviewedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      },
      { upsert: true }
    );

    await CollegeEmployerConnection.findOneAndUpdate(
      { collegeId: college2User._id, employerId: employer2User._id },
      {
        collegeId: college2User._id,
        employerId: employer2User._id,
        initiatedBy: 'COLLEGE',
        message: 'Inviting CogniCraft AI Labs to review our verified Nanded student IT cohort.',
        status: 'ACCEPTED',
        reviewedBy: employer2User._id,
        reviewedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      { upsert: true }
    );

    // ==========================================
    // 9. CAREER EVENTS & NOTIFICATIONS
    // ==========================================
    console.log('📢 [8/8] Seeding Career Events & Telemetry...');
    await CareerEvent.findOneAndUpdate(
      { title: 'Resume & Interview Readiness Masterclass for Rural Colleges' },
      {
        title: 'Resume & Interview Readiness Masterclass for Rural Colleges',
        description:
          'Live interactive workshop hosted by industry mentors covering ATS resume structuring, behavioral interview framing, and live technical mock interviews.',
        eventType: 'WORKSHOP',
        organizerId: adminUser._id,
        organizerRole: 'ADMIN',
        organizerName: 'CareerBridge Mission Bharat Team',
        startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        location: 'Virtual / Online Webinar',
        meetingUrl: 'https://meet.careerbridge.demo/webinar-readiness-2026',
        registrationDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        capacity: 500,
        registeredCount: 84,
        status: 'PUBLISHED',
        tags: ['PlacementPrep', 'ResumeBuilding', 'MissionBharat'],
      },
      { upsert: true }
    );
    metrics.eventsSeeded++;

    // Seed sample notification
    await Notification.findOneAndUpdate(
      { recipientId: student1User._id, title: 'Congratulations! Official Selection Offer from ZenithPay' },
      {
        recipientId: student1User._id,
        type: 'APPLICATION_STATUS_CHANGED',
        title: 'Congratulations! Official Selection Offer from ZenithPay',
        message: 'ZenithPay Technologies has selected you for Associate Full-Stack Software Engineer (₹6.5 - ₹8.5 LPA).',
        relatedEntityType: 'APPLICATION',
        relatedEntityId: app1._id.toString(),
        isRead: false,
        createdAt: new Date(),
      },
      { upsert: true }
    );
    metrics.notificationsSeeded++;

    // Initialize Learning Hub initial seed data
    try {
      await LearningHubService.getInstance().seedInitialData();
    } catch {
      // Non-fatal if already seeded
    }

    // ==========================================
    // SUMMARY REPORT
    // ==========================================
    console.log('\n====================================================');
    console.log('✅ SEEDING COMPLETE — ALL RECORDS INSERTED & VERIFIED');
    console.log('====================================================');
    console.table([
      { Module: 'Demo Users (Total)', Count: metrics.usersCreated },
      { Module: 'Colleges (Tier-2/3)', Count: metrics.collegesSeeded },
      { Module: 'Employers & Companies', Count: metrics.employersSeeded },
      { Module: 'Placement Drives', Count: metrics.drivesSeeded },
      { Module: 'Connected Applications', Count: metrics.applicationsSeeded },
      { Module: 'Verified Placements (Selected)', Count: 2 },
      { Module: 'Interviews Scheduled/Done', Count: metrics.interviewsSeeded },
      { Module: 'Cohorts Initialized', Count: metrics.cohortsSeeded },
      { Module: 'Mentorship Profiles & Rel.', Count: metrics.mentorshipSeeded },
      { Module: 'Career Events', Count: metrics.eventsSeeded },
      { Module: 'System Notifications', Count: metrics.notificationsSeeded },
    ]);
    console.log('🔑 Demo credentials for all accounts:');
    console.log(`   Password: ${DEMO_PASSWORD}`);
    console.log('   Admin:    admin@careerbridge.demo');
    console.log('   College:  college01@careerbridge.demo, college02@careerbridge.demo');
    console.log('   Employer: employer01@careerbridge.demo, employer02@careerbridge.demo');
    console.log('   Student:  student01@careerbridge.demo, student02@careerbridge.demo');
    console.log('   Mentor:   mentor01@careerbridge.demo\n');
  } catch (error) {
    console.error('[Seed] Error during seed data execution:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

// Execute immediately when run as a standalone script
seedDatabase();
