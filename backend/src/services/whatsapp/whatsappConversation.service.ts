import { WhatsAppAccount } from '../../models/whatsAppAccount.model.js';
import { WhatsAppConversation } from '../../models/whatsAppConversation.model.js';
import { PlacementDrive } from '../../models/placementDrive.model.js';
import { PlacementApplication } from '../../models/placementApplication.model.js';
import { Interview } from '../../models/interview.model.js';
import { User } from '../../models/user.model.js';
import { WhatsAppService } from './whatsapp.service.js';
import { WhatsAppAccountLinkingService } from './whatsappAccountLinking.service.js';
import { WhatsAppAiAssistantService } from './whatsappAiAssistant.service.js';
import { ParsedWhatsAppMessage } from './whatsappMessageParser.service.js';
import { config } from '../../config/env.js';

export class WhatsAppConversationService {
  /**
   * Main dispatch orchestrator for all incoming WhatsApp messages.
   */
  static async handleInboundMessage(msg: ParsedWhatsAppMessage): Promise<void> {
    const { from, command, rawText } = msg;
    const waService = WhatsAppService.getInstance();

    // 1. Fetch or create conversation state
    let conv = await WhatsAppConversation.findOne({ phoneNumber: from });
    if (!conv) {
      conv = await WhatsAppConversation.create({
        phoneNumber: from,
        currentMenu: 'MAIN_MENU',
        conversationContext: {},
        lastInteractionAt: new Date(),
        active: true,
      });
    } else {
      conv.lastInteractionAt = new Date();
      await conv.save();
    }

    // 2. Fetch linked student account
    const account = await WhatsAppAccount.findOne({ phoneNumber: from, status: 'ACTIVE' });
    let studentLang = 'en';
    if (account && (!conv.userId || conv.userId.toString() !== account.userId.toString())) {
      conv.userId = account.userId;
      await conv.save();
    }
    if (account?.userId) {
      const studentUser = await User.findById(account.userId).lean();
      if (studentUser?.preferredLanguage) {
        studentLang = studentUser.preferredLanguage;
      }
    }

    // 3. Check linking code command (e.g. LINK_CB94X2)
    if (command && command.startsWith('LINK_')) {
      const code = command.substring(5);
      const linkResult = await WhatsAppAccountLinkingService.verifyAndLinkAccount({
        rawCode: code,
        phoneNumber: from,
      });

      if (!linkResult.success) {
        await waService.sendTextMessage(
          from,
          `❌ *Verification Failed*\n\n${linkResult.message}\n\nPlease check the linking code in your CareerBridge portal and try again.`
        );
      }
      return;
    }

    // 4. Consent commands: STOP and START
    if (command === 'STOP') {
      if (account) {
        account.status = 'OPTED_OUT';
        account.notificationsEnabled = false;
        account.optOutAt = new Date();
        await account.save();
      }
      await waService.sendTextMessage(
        from,
        `🛑 *WhatsApp Notifications Paused*\n\nYou have opted out of CareerBridge WhatsApp alerts. You will not receive job alerts or interview notifications here.\n\nTo re-enable alerts anytime, simply reply *START*.`
      );
      return;
    }

    if (command === 'START') {
      if (account) {
        account.status = 'ACTIVE';
        account.notificationsEnabled = true;
        account.optOutAt = undefined;
        account.consentAt = new Date();
        account.consentSource = 'WHATSAPP_START_COMMAND';
        await account.save();
      }
      await waService.sendTextMessage(
        from,
        `✅ *Welcome Back to CareerBridge!*\n\nYour WhatsApp notifications are now active. Type *MENU* to explore opportunities and career updates.`
      );
      return;
    }

    // 5. Menu dispatch
    switch (command) {
      case 'MENU':
        await this.sendWelcomeMenu(from, studentLang);
        break;

      case 'JOBS':
        await this.handleJobDiscovery(from);
        break;

      case 'APPLICATIONS':
        await this.handleApplicationTracking(from, account);
        break;

      case 'INTERVIEWS':
        await this.handleInterviewUpdates(from, account);
        break;

      case 'PROFILE':
        await this.handleProfileOverview(from, account);
        break;

      case 'SKILLS':
        await this.handleSkillsGuidance(from);
        break;

      case 'GUIDANCE':
        await waService.sendTextMessage(
          from,
          `🤖 *AI Career Guidance Assistant*\n\nAsk me anything about:\n- Career paths for your diploma or engineering branch\n- How to prepare for tech and HR interviews\n- Resume writing and project showcase tips\n- Recommended free learning resources\n\n_Type your question directly, e.g., "How should a CSE diploma graduate prepare for frontend developer interviews?"_`
        );
        break;

      case 'HELP':
        await waService.sendTextMessage(
          from,
          `ℹ️ *CareerBridge WhatsApp Help*\n\nAvailable commands:\n- *MENU* - Show main navigation menu\n- *JOBS* - Browse active campus drives\n- *APPLICATIONS* - View your application status\n- *INTERVIEWS* - View upcoming interview dates\n- *PROFILE* - View your linked profile\n- *SKILLS* - Recommended industry skills\n- *STOP* - Pause notifications\n- *START* - Resume notifications\n\nNeed technical support? Visit our portal at ${config.clientUrl}`
        );
        break;

      default:
        // If user texted a natural language query, answer via AI Career Assistant
        if (rawText && rawText.length > 5) {
          const aiReply = await WhatsAppAiAssistantService.answerCareerQuery({
            question: rawText,
            phoneNumber: from,
            userId: account?.userId?.toString(),
          });
          await waService.sendTextMessage(from, aiReply);
        } else {
          await waService.sendTextMessage(
            from,
            `👋 Hello! We didn't recognize that command.\n\nType *MENU* to view available career options or send your career question directly.`
          );
        }
        break;
    }
  }

  /**
   * Sends the official CareerBridge conversational menu (supports English, Hindi, and Hinglish).
   */
  public static async sendWelcomeMenu(to: string, lang: string = 'en'): Promise<void> {
    const waService = WhatsAppService.getInstance();
    let welcomeText =
      `🎓 *Welcome to CareerBridge – Your Career Companion!*\n\n` +
      `Choose what you want to explore:\n\n` +
      `*1.* Find Jobs & Internships (Reply *1* or *JOBS*)\n` +
      `*2.* My Applications (Reply *2* or *APPLICATIONS*)\n` +
      `*3.* Interview Updates (Reply *3* or *INTERVIEWS*)\n` +
      `*4.* My Profile (Reply *4* or *PROFILE*)\n` +
      `*5.* Skill Development (Reply *5* or *SKILLS*)\n` +
      `*6.* AI Career Guidance (Reply *6* or *GUIDANCE*)\n` +
      `*7.* Help & Support (Reply *7* or *HELP*)`;

    let buttonTitles = { jobs: 'Find Jobs', apps: 'My Applications', ai: 'AI Guidance' };

    if (lang === 'hi') {
      welcomeText =
        `🎓 *CareerBridge में आपका स्वागत है – आपका कैरियर साथी!*\n\n` +
        `अपनी पसंद का विकल्प चुनें:\n\n` +
        `*1.* नौकरियां और इंटर्नशिप खोजें (*1* या *JOBS*)\n` +
        `*2.* मेरे आवेदन (*2* या *APPLICATIONS*)\n` +
        `*3.* साक्षात्कार अपडेट (*3* या *INTERVIEWS*)\n` +
        `*4.* मेरी प्रोफ़ाइल (*4* या *PROFILE*)\n` +
        `*5.* कौशल विकास (*5* या *SKILLS*)\n` +
        `*6.* AI कैरियर मार्गदर्शन (*6* या *GUIDANCE*)\n` +
        `*7.* सहायता एवं समर्थन (*7* या *HELP*)`;
      buttonTitles = { jobs: 'नौकरियां खोजें', apps: 'मेरे आवेदन', ai: 'AI मार्गदर्शन' };
    } else if (lang === 'hi-Latn') {
      welcomeText =
        `🎓 *CareerBridge me aapka swagat hai – Aapka Career Companion!*\n\n` +
        `Aap kya explore karna chahte hain:\n\n` +
        `*1.* Jobs aur Internships (*1* ya *JOBS* reply karein)\n` +
        `*2.* Mere Applications (*2* ya *APPLICATIONS* reply karein)\n` +
        `*3.* Interview Updates (*3* ya *INTERVIEWS* reply karein)\n` +
        `*4.* Meri Profile (*4* ya *PROFILE* reply karein)\n` +
        `*5.* Skill Development (*5* ya *SKILLS* reply karein)\n` +
        `*6.* AI Career Guidance (*6* ya *GUIDANCE* reply karein)\n` +
        `*7.* Help & Support (*7* ya *HELP* reply karein)`;
      buttonTitles = { jobs: 'Jobs Khojein', apps: 'Applications', ai: 'AI Guidance' };
    }

    await waService.sendInteractiveButtons(to, welcomeText, [
      { id: 'CMD_JOBS', title: buttonTitles.jobs },
      { id: 'CMD_APPLICATIONS', title: buttonTitles.apps },
      { id: 'CMD_GUIDANCE', title: buttonTitles.ai },
    ]);
  }

  /**
   * Fetches real published jobs from MongoDB.
   */
  private static async handleJobDiscovery(to: string): Promise<void> {
    const waService = WhatsAppService.getInstance();

    const drives = await PlacementDrive.find({ status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .limit(3)
      .exec();

    if (!drives || drives.length === 0) {
      await waService.sendTextMessage(
        to,
        `💼 *Campus Placement Opportunities*\n\nNo active placement drives are published right now. New campus recruitment drives are posted weekly!\n\nType *MENU* to return.`
      );
      return;
    }

    let message = `💼 *Active Placement Opportunities (${drives.length} drives)*\n\n`;

    drives.forEach((d, idx) => {
      const deadline = new Date(d.applicationDeadline).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const location = d.location || d.workMode;
      const skills = (d.requiredSkills || []).slice(0, 3).join(', ') || 'General';

      message += `*${idx + 1}. ${d.title}*\n`;
      message += `🏢 *Company:* ${d.organizationName}\n`;
      message += `📍 *Type/Location:* ${d.opportunityType} · ${location}\n`;
      message += `🛠️ *Skills:* ${skills}\n`;
      if (d.salaryRange) message += `💰 *Package:* ${d.salaryRange}\n`;
      message += `⏳ *Deadline:* ${deadline}\n`;
      message += `🔗 *Apply:* ${config.clientUrl}\n\n`;
    });

    message += `_Apply directly through your CareerBridge web portal. Reply *MENU* to return._`;

    await waService.sendTextMessage(to, message);
  }

  /**
   * Fetches student's real application status from MongoDB.
   */
  private static async handleApplicationTracking(to: string, account: any): Promise<void> {
    const waService = WhatsAppService.getInstance();

    if (!account || !account.userId) {
      await waService.sendTextMessage(
        to,
        `🔒 *Account Linking Required*\n\nTo view your personal application status, please link your CareerBridge student account first.\n\n1. Log in at ${config.clientUrl}\n2. Go to Profile Settings -> WhatsApp\n3. Click "Connect WhatsApp" and send the 6-character code here.`
      );
      return;
    }

    const apps = await PlacementApplication.find({ studentId: account.userId })
      .populate('driveId', 'title organizationName location opportunityType')
      .sort({ appliedAt: -1 })
      .limit(5)
      .exec();

    if (!apps || apps.length === 0) {
      await waService.sendTextMessage(
        to,
        `📋 *My Applications*\n\nYou haven't submitted any job or internship applications yet.\n\nType *JOBS* to discover active recruitment drives!`
      );
      return;
    }

    let message = `📋 *My Applications (${apps.length} records)*\n\n`;

    apps.forEach((app: any, idx) => {
      const drive = app.driveId || {};
      const appliedDate = new Date(app.appliedAt || app.createdAt).toLocaleDateString('en-IN');
      const statusIcon =
        app.status === 'SELECTED'
          ? '🎉'
          : app.status === 'INTERVIEW_SCHEDULED'
          ? '📅'
          : app.status === 'SHORTLISTED'
          ? '⭐'
          : app.status === 'REJECTED'
          ? '❌'
          : '⏳';

      message += `*${idx + 1}. ${drive.title || 'Placement Opportunity'}*\n`;
      message += `🏢 *Company:* ${drive.organizationName || 'Partner Recruiter'}\n`;
      message += `📊 *Status:* ${statusIcon} *${app.status.replace(/_/g, ' ')}*\n`;
      message += `📅 *Applied:* ${appliedDate}\n\n`;
    });

    message += `_View full interview instructions on the portal: ${config.clientUrl}_`;

    await waService.sendTextMessage(to, message);
  }

  /**
   * Fetches student's interview schedule.
   */
  private static async handleInterviewUpdates(to: string, account: any): Promise<void> {
    const waService = WhatsAppService.getInstance();

    if (!account || !account.userId) {
      await waService.sendTextMessage(
        to,
        `🔒 *Account Linking Required*\n\nPlease link your CareerBridge student account to check interview rounds.\n\nLog in at ${config.clientUrl} -> Settings -> WhatsApp.`
      );
      return;
    }

    const interviews = await Interview.find({
      studentId: account.userId,
      status: { $ne: 'CANCELLED' },
    })
      .sort({ scheduledAt: 1 })
      .limit(3)
      .exec();

    if (!interviews || interviews.length === 0) {
      await waService.sendTextMessage(
        to,
        `📅 *Interview Updates*\n\nYou have no interviews currently scheduled.\n\nKeep updating your profile skills and applying to active campus drives!`
      );
      return;
    }

    let message = `📅 *Upcoming Interviews (${interviews.length})*\n\n`;

    interviews.forEach((int: any, idx) => {
      const dateStr = new Date(int.scheduledAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      message += `*${idx + 1}. ${int.roundName || 'Interview Round'}*\n`;
      message += `🏢 *Format:* ${int.interviewType}\n`;
      message += `🕒 *Time:* ${dateStr}\n`;
      if (int.meetingUrl) {
        message += `🔗 *Link:* ${int.meetingUrl}\n`;
      }
      message += `📊 *Status:* ${int.status}\n\n`;
    });

    message += `_Log in for mock interview prep questions: ${config.clientUrl}_`;

    await waService.sendTextMessage(to, message);
  }

  /**
   * Fetches student's career profile overview.
   */
  private static async handleProfileOverview(to: string, account: any): Promise<void> {
    const waService = WhatsAppService.getInstance();

    if (!account || !account.userId) {
      await waService.sendTextMessage(
        to,
        `🔒 *Account Linking Required*\n\nLink your account to see your profile completion score and verified skills.`
      );
      return;
    }

    const student = await User.findById(account.userId);
    if (!student) {
      await waService.sendTextMessage(to, `Account record not found.`);
      return;
    }

    const sp = student.studentProfile || {};
    const skills = (sp.skills || []).slice(0, 5).join(', ') || 'None declared yet';
    const score = sp.profileCompletionScore || 0;

    let message = `👤 *Student Career Profile*\n\n`;
    message += `*Name:* ${student.fullName}\n`;
    if (sp.course) message += `*Course:* ${sp.course}\n`;
    if (sp.collegeName) message += `*College:* ${sp.collegeName}\n`;
    message += `*Profile Strength:* ${score}/100\n`;
    message += `*Skills:* ${skills}\n\n`;
    message += `_Build your ATS Resume and add verified portfolio projects at ${config.clientUrl}_`;

    await waService.sendTextMessage(to, message);
  }

  /**
   * Guidance on skills and tests.
   */
  private static async handleSkillsGuidance(to: string): Promise<void> {
    const waService = WhatsAppService.getInstance();

    const text =
      `🚀 *Skill Development & Assessments*\n\n` +
      `Boost your placement eligibility with standardized skill tests:\n` +
      `- *Web Development:* HTML, CSS, JavaScript, React\n` +
      `- *Backend & Cloud:* Node.js, Express, MongoDB, REST APIs\n` +
      `- *Programming:* Java, Python, C++, Data Structures\n` +
      `- *Employability:* Professional Communication & Problem Solving\n\n` +
      `Students with verified skill assessments receive higher recruiter shortlisting rates!\n\n` +
      `🔗 *Take assessments on CareerBridge:* ${config.clientUrl}`;

    await waService.sendTextMessage(to, text);
  }
}
