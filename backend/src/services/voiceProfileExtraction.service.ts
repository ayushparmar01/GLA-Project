import { StudentProfileData } from '../types/index.js';

export interface ExtractedVoiceProfile {
  fullName?: string;
  educationLevel?: string;
  degree?: string;
  course?: string;
  specialization?: string;
  collegeName?: string;
  skills: string[];
  careerInterests: string[];
  preferredWorkLocation: string[];
  preferredJobRoles: string[];
  expectedStipend?: string;
  workExperienceSummary?: string;
  detectedLanguage: 'ta' | 'kn' | 'hi' | 'en';
  confidenceScore: number;
  rawTranscript: string;
}

export class VoiceProfileExtractionService {
  /**
   * Intelligently parses natural speech transcripts in Tamil, Kannada, Hindi, and English
   * into structured student profile fields.
   */
  public static extractProfileFromTranscript(
    transcript: string,
    forcedLanguage?: 'ta' | 'kn' | 'hi' | 'en'
  ): ExtractedVoiceProfile {
    const text = (transcript || '').trim();
    const detectedLang = forcedLanguage || this.detectLanguage(text);

    const extracted: ExtractedVoiceProfile = {
      skills: [],
      careerInterests: [],
      preferredWorkLocation: [],
      preferredJobRoles: [],
      detectedLanguage: detectedLang,
      confidenceScore: 0.85,
      rawTranscript: text,
    };

    if (!text) {
      extracted.confidenceScore = 0;
      return extracted;
    }

    // 1. Extract Full Name
    extracted.fullName = this.extractName(text, detectedLang);

    // 2. Extract Education Degree / Qualification
    const edu = this.extractEducation(text, detectedLang);
    if (edu.degree) extracted.degree = edu.degree;
    if (edu.educationLevel) extracted.educationLevel = edu.educationLevel;
    if (edu.course) extracted.course = edu.course;
    if (edu.specialization) extracted.specialization = edu.specialization;

    // 3. Extract College Name
    extracted.collegeName = this.extractCollege(text, detectedLang);

    // 4. Extract Skills
    extracted.skills = this.extractSkills(text, detectedLang);

    // 5. Extract Preferred Locations
    extracted.preferredWorkLocation = this.extractLocations(text, detectedLang);

    // 6. Extract Preferred Job Roles & Career Interests
    const roles = this.extractRolesAndInterests(text, detectedLang);
    extracted.preferredJobRoles = roles.roles;
    extracted.careerInterests = roles.interests;

    // 7. Extract Stipend / Salary Expectations
    extracted.expectedStipend = this.extractStipend(text, detectedLang);

    // 8. Extract Work Experience / Internships Mentioned
    extracted.workExperienceSummary = this.extractExperience(text, detectedLang);

    // Compute heuristic confidence based on how many fields were successfully identified
    let detectedFieldCount = 0;
    if (extracted.fullName) detectedFieldCount += 1.5;
    if (extracted.degree || extracted.course) detectedFieldCount += 2;
    if (extracted.skills.length > 0) detectedFieldCount += 2;
    if (extracted.preferredWorkLocation.length > 0) detectedFieldCount += 1.5;
    if (extracted.preferredJobRoles.length > 0) detectedFieldCount += 1.5;
    if (extracted.expectedStipend) detectedFieldCount += 1;

    extracted.confidenceScore = Math.min(0.98, Math.max(0.4, Number((detectedFieldCount / 9).toFixed(2))));

    return extracted;
  }

  /**
   * Detects whether input contains Tamil, Kannada, Hindi, or English scripts.
   */
  private static detectLanguage(text: string): 'ta' | 'kn' | 'hi' | 'en' {
    const tamilRegex = /[\u0B80-\u0BFF]/;
    const kannadaRegex = /[\u0C80-\u0CFF]/;
    const devanagariRegex = /[\u0900-\u097F]/;

    if (tamilRegex.test(text)) return 'ta';
    if (kannadaRegex.test(text)) return 'kn';
    if (devanagariRegex.test(text)) return 'hi';
    return 'en';
  }

  /**
   * Name extraction for Tamil, Kannada, Hindi, English.
   */
  private static extractName(text: string, lang: 'ta' | 'kn' | 'hi' | 'en'): string | undefined {
    // Tamil patterns: "என் பெயர் [விஜய்]", "பெயர் [விஜய்]"
    if (lang === 'ta') {
      const match = text.match(/(?:என்\s+பெயர்|பெயர்|நான்)\s+([^\s,.]+)/i);
      if (match && match[1]) return match[1].trim();
    }

    // Kannada patterns: "ನನ್ನ ಹೆಸರು [ಪ್ರವೀಣ್]", "ಹೆಸರು [ಪ್ರವೀಣ್]"
    if (lang === 'kn') {
      const match = text.match(/(?:ನನ್ನ\s+ಹೆಸರು|ಹೆಸರು|ನಾನು)\s+([^\s,.]+)/i);
      if (match && match[1]) return match[1].trim();
    }

    // Hindi patterns: "मेरा नाम [राहुल] है"
    if (lang === 'hi') {
      const match = text.match(/(?:मेरा\s+नाम|नाम|मैं)\s+([^\s,.]+)/i);
      if (match && match[1]) return match[1].trim();
    }

    // English patterns: "My name is Vijay", "I am Vijay", "Name is Vijay"
    const enMatch = text.match(/(?:my\s+name\s+is|i\s+am|name\s+is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (enMatch && enMatch[1]) {
      const candidate = enMatch[1].trim();
      if (!['a', 'the', 'student', 'pursuing', 'studying', 'from'].includes(candidate.toLowerCase())) {
        return candidate;
      }
    }

    return undefined;
  }

  /**
   * Qualification & Branch extraction
   */
  private static extractEducation(
    text: string,
    lang: 'ta' | 'kn' | 'hi' | 'en'
  ): { degree?: string; educationLevel?: string; course?: string; specialization?: string } {
    const result: { degree?: string; educationLevel?: string; course?: string; specialization?: string } = {};
    const lower = text.toLowerCase();

    // Degree detection
    if (
      lower.includes('diploma') ||
      lower.includes('டிப்ளமோ') ||
      lower.includes('டிப்ளமா') ||
      lower.includes('ಡಿಪ್ಲೊಮಾ') ||
      lower.includes('डिप्लोमा')
    ) {
      result.degree = 'Diploma';
      result.educationLevel = 'Diploma';
    } else if (
      lower.includes('b.tech') ||
      lower.includes('btech') ||
      lower.includes('பி.டெக்') ||
      lower.includes('பிடெக்') ||
      lower.includes('ಬಿ.ಟೆಕ್') ||
      lower.includes('ಬಿಟೆಕ್')
    ) {
      result.degree = 'B.Tech';
      result.educationLevel = 'Undergraduate';
    } else if (
      lower.includes('b.e') ||
      lower.includes('be') ||
      lower.includes('பி.இ') ||
      lower.includes('ಬಿ.ಇ')
    ) {
      result.degree = 'B.E.';
      result.educationLevel = 'Undergraduate';
    } else if (lower.includes('bca') || lower.includes('பிசிஏ') || lower.includes('ಬಿಸಿಎ')) {
      result.degree = 'BCA';
      result.educationLevel = 'Undergraduate';
    } else if (lower.includes('mca') || lower.includes('எம்சிஏ') || lower.includes('ಎಂಸಿಎ')) {
      result.degree = 'MCA';
      result.educationLevel = 'Postgraduate';
    } else if (lower.includes('iti') || lower.includes('ஐடிஐ') || lower.includes('ಐಟಿಐ')) {
      result.degree = 'ITI';
      result.educationLevel = 'Vocational';
    } else if (
      lower.includes('degree') ||
      lower.includes('பட்டப்படிப்பு') ||
      lower.includes('டிகிரி') ||
      lower.includes('ಪದವಿ')
    ) {
      result.degree = 'Bachelor Degree';
      result.educationLevel = 'Undergraduate';
    }

    // Branch / Specialization detection
    if (
      lower.includes('electrical') ||
      lower.includes('எலக்ட்ரிக்கல்') ||
      lower.includes('மின் பொறியியல்') ||
      lower.includes('ಎಲೆಕ್ಟ್ರಿಕಲ್') ||
      lower.includes('ವಿದ್ಯುತ್') ||
      lower.includes('इलेक्ट्रिकल')
    ) {
      result.specialization = 'Electrical Engineering';
      result.course = result.degree ? `${result.degree} in Electrical Engineering` : 'Electrical Engineering';
    } else if (
      lower.includes('mechanical') ||
      lower.includes('மெக்கானிக்கல்') ||
      lower.includes('ಯಾಂತ್ರಿಕ') ||
      lower.includes('ಮೆಕ್ಯಾನಿಕಲ್') ||
      lower.includes('मैकेनिकल')
    ) {
      result.specialization = 'Mechanical Engineering';
      result.course = result.degree ? `${result.degree} in Mechanical Engineering` : 'Mechanical Engineering';
    } else if (
      lower.includes('computer science') ||
      lower.includes('cse') ||
      lower.includes('கம்ப்யூட்டர் சயின்ஸ்') ||
      lower.includes('கணினி அறிவியல்') ||
      lower.includes('ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್') ||
      lower.includes('कंप्यूटर साइंस')
    ) {
      result.specialization = 'Computer Science and Engineering';
      result.course = result.degree ? `${result.degree} in Computer Science` : 'Computer Science and Engineering';
    } else if (
      lower.includes('electronics') ||
      lower.includes('ece') ||
      lower.includes('எலக்ட்ரானிக்ஸ்') ||
      lower.includes('ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್')
    ) {
      result.specialization = 'Electronics and Communication';
      result.course = result.degree ? `${result.degree} in ECE` : 'Electronics and Communication';
    } else if (
      lower.includes('civil') ||
      lower.includes('சிவில்') ||
      lower.includes('ಸಿವಿಲ್') ||
      lower.includes('सिविल')
    ) {
      result.specialization = 'Civil Engineering';
      result.course = result.degree ? `${result.degree} in Civil Engineering` : 'Civil Engineering';
    } else if (result.degree) {
      result.course = result.degree;
    }

    return result;
  }

  /**
   * College / Polytechnic name detection
   */
  private static extractCollege(text: string, lang: 'ta' | 'kn' | 'hi' | 'en'): string | undefined {
    const lower = text.toLowerCase();
    // Look for phrases like "Government Polytechnic", "BIT College", "College of Technology"
    const collegePatterns = [
      /(?:college|polytechnic|institute|university)\s+(?:of\s+)?([A-Za-z\s]+)/i,
      /([A-Za-z\s]+)\s+(?:college|polytechnic|institute)/i,
      /(?:கல்லூரி|பாலிடெக்னிக்|கல்வி நிலையம்)\s+([^\s,.]+)/i,
      /([^\s,.]+)\s+(?:கல்லூரி|பாலிடெக்னிக்)/i,
      /(?:ಕಾಲೇಜು|ಪಾಲಿಟೆಕ್ನಿಕ್|ಸಂಸ್ಥೆ)\s+([^\s,.]+)/i,
      /([^\s,.]+)\s+(?:ಕಾಲೇಜು|ಪಾಲಿಟೆಕ್ನಿಕ್)/i,
    ];

    for (const pattern of collegePatterns) {
      const match = text.match(pattern);
      if (match && match[0]) {
        const clean = match[0].trim();
        if (clean.length >= 4 && clean.length <= 80) return clean;
      }
    }

    if (lower.includes('polytechnic') || lower.includes('பாலிடெக்னிக்') || lower.includes('ಪಾಲಿಟೆಕ್ನಿಕ್')) {
      return 'Government Polytechnic College';
    }

    return undefined;
  }

  /**
   * Skill keywords extraction across Tamil, Kannada, Hindi, and English.
   */
  private static extractSkills(text: string, lang: 'ta' | 'kn' | 'hi' | 'en'): string[] {
    const foundSkills = new Set<string>();
    const lower = text.toLowerCase();

    const skillCatalog: Array<{ keywords: string[]; canonical: string }> = [
      // Electrical & Hardware Skills
      {
        keywords: [
          'electrical maintenance',
          'electrical',
          'எலக்ட்ரிக்கல் மெயின்டனன்ஸ்',
          'மின் பராமரிப்பு',
          'ವಿದ್ಯುತ್ ನಿರ್ವಹಣೆ',
          'इलेक्ट्रिकल मेंटेनेंस',
        ],
        canonical: 'Electrical Maintenance',
      },
      {
        keywords: ['wiring', 'house wiring', 'industrial wiring', 'வயரிங்', 'ವೈರಿಂಗ್', 'वायरिंग'],
        canonical: 'Wiring & Circuit Installation',
      },
      {
        keywords: ['motor servicing', 'motor', 'மோட்டார்', 'ಮೋಟಾರ್', 'मोटर'],
        canonical: 'Motor Servicing & Rewinding',
      },
      {
        keywords: ['plc', 'scada', 'automation', 'பிஎல்சி', 'ಪಿಎಲ್ಸಿ', 'ऑटोमेशन'],
        canonical: 'PLC & Industrial Automation',
      },
      {
        keywords: ['transformer', 'டிரான்ஸ்பார்மர்', 'ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್'],
        canonical: 'Transformer Maintenance',
      },
      {
        keywords: ['welding', 'வெல்டிங்', 'ವೆಲ್ಡಿಂಗ್', 'वेल्डिंग'],
        canonical: 'Welding & Fabrication',
      },
      {
        keywords: ['autocad', 'cad', 'ஆட்டோகேட்', 'ಆಟೋಕ್ಯಾಡ್'],
        canonical: 'AutoCAD Drafting',
      },
      {
        keywords: ['cnc', 'machining', 'சிஎன்சி'],
        canonical: 'CNC Machine Operation',
      },

      // Software & IT Skills
      {
        keywords: ['python', 'பைத்தான்', 'ಪೈಥಾನ್', 'पायथन'],
        canonical: 'Python',
      },
      {
        keywords: ['java', 'ஜாவா', 'ಜಾವಾ', 'जावा'],
        canonical: 'Java',
      },
      {
        keywords: ['javascript', 'js', 'ஜாவாஸ்கிரிப்ட்'],
        canonical: 'JavaScript',
      },
      {
        keywords: ['react', 'react.js', 'ரியாக்ட்', 'ರಿಯಾಕ್ಟ್'],
        canonical: 'React',
      },
      {
        keywords: ['node', 'node.js', 'நோட் ஜேஎஸ்'],
        canonical: 'Node.js',
      },
      {
        keywords: ['sql', 'database', 'mysql', 'டேட்டாபேஸ்', 'ಡೇಟಾಬೇಸ್'],
        canonical: 'SQL & Database Management',
      },
      {
        keywords: ['html', 'css', 'web development', 'வலை வடிவமைப்பு', 'ವೆಬ್ ಡೆವಲಪ್ಮೆಂಟ್'],
        canonical: 'HTML/CSS & Web Basics',
      },
      {
        keywords: ['excel', 'ms excel', 'எக்செல்', 'ಎಕ್ಸೆಲ್'],
        canonical: 'MS Excel & Data Entry',
      },
      {
        keywords: ['troubleshooting', 'repair', 'பழுது நீக்கம்', 'ದೋಷನಿವಾರಣೆ'],
        canonical: 'Hardware Troubleshooting',
      },
    ];

    for (const item of skillCatalog) {
      for (const kw of item.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          foundSkills.add(item.canonical);
          break;
        }
      }
    }

    return Array.from(foundSkills);
  }

  /**
   * Location extraction for Tamil, Kannada, and regional job hubs.
   */
  private static extractLocations(text: string, lang: 'ta' | 'kn' | 'hi' | 'en'): string[] {
    const locations = new Set<string>();
    const lower = text.toLowerCase();

    const locationCatalog: Array<{ keywords: string[]; canonical: string }> = [
      // Tamil Nadu
      { keywords: ['chennai', 'மெட்ராஸ்', 'சென்னை'], canonical: 'Chennai' },
      { keywords: ['coimbatore', 'kovai', 'கோயம்புத்தூர்', 'கோவை'], canonical: 'Coimbatore' },
      { keywords: ['madurai', 'மதுரை'], canonical: 'Madurai' },
      { keywords: ['salem', 'சேலம்'], canonical: 'Salem' },
      { keywords: ['trichy', 'tiruchirappalli', 'திருச்சி'], canonical: 'Tiruchirappalli' },
      { keywords: ['hosur', 'ஓசூர்'], canonical: 'Hosur' },

      // Karnataka
      { keywords: ['bengaluru', 'bangalore', 'ಬೆಂಗಳೂರು'], canonical: 'Bengaluru' },
      { keywords: ['mysuru', 'mysore', 'ಮೈಸೂರು'], canonical: 'Mysuru' },
      { keywords: ['hubballi', 'hubli', 'ಹುಬ್ಬಳ್ಳಿ'], canonical: 'Hubballi' },
      { keywords: ['belagavi', 'belgaum', 'ಬೆಳಗಾವಿ'], canonical: 'Belagavi' },
      { keywords: ['mangaluru', 'mangalore', 'ಮಂಗಳೂರು'], canonical: 'Mangaluru' },

      // Maharashtra & Others
      { keywords: ['pune', 'पुणे'], canonical: 'Pune' },
      { keywords: ['mumbai', 'मुंबई'], canonical: 'Mumbai' },
      { keywords: ['kolhapur', 'कोल्हापूर'], canonical: 'Kolhapur' },
      { keywords: ['hyderabad', 'హైదరాబాద్'], canonical: 'Hyderabad' },
    ];

    for (const loc of locationCatalog) {
      for (const kw of loc.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          locations.add(loc.canonical);
          break;
        }
      }
    }

    return Array.from(locations);
  }

  /**
   * Preferred roles & Career interests
   */
  private static extractRolesAndInterests(
    text: string,
    lang: 'ta' | 'kn' | 'hi' | 'en'
  ): { roles: string[]; interests: string[] } {
    const roles = new Set<string>();
    const interests = new Set<string>();
    const lower = text.toLowerCase();

    const roleCatalog: Array<{ keywords: string[]; role: string; interest: string }> = [
      {
        keywords: ['technician', 'டெக்னீசியன்', 'ತಂತ್ರಜ್ಞ', 'टेक्नीशियन'],
        role: 'Field Technician',
        interest: 'Industrial & Field Maintenance',
      },
      {
        keywords: ['electrician', 'எலக்ட்ரீசியன்', 'ಎಲೆಕ್ಟ್ರೀಷಿಯನ್', 'इलेक्ट्रीशियन'],
        role: 'Junior Electrician',
        interest: 'Electrical Installation & Safety',
      },
      {
        keywords: ['maintenance engineer', 'பராமரிப்பு பொறியாளர்', 'ನಿರ್ವಹಣಾ ಎಂಜಿನಿಯರ್'],
        role: 'Maintenance Engineer',
        interest: 'Plant & Equipment Maintenance',
      },
      {
        keywords: ['software engineer', 'developer', 'மென்பொருள் பொறியாளர்', 'ಡೆವಲಪರ್', 'ಸಾಫ್ಟ್‌ವೇರ್'],
        role: 'Associate Software Engineer',
        interest: 'Software Development & Coding',
      },
      {
        keywords: ['quality', 'qc', 'குவாலிட்டி', 'ಗುಣಮಟ್ಟ'],
        role: 'Quality Assurance Inspector',
        interest: 'Quality Control & Testing',
      },
      {
        keywords: ['trainee', 'graduate trainee', 'பயிற்சியாளர்', 'ತರಬೇತಿ'],
        role: 'Graduate Apprentice Trainee',
        interest: 'Technical Apprenticeship',
      },
    ];

    for (const item of roleCatalog) {
      for (const kw of item.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          roles.add(item.role);
          interests.add(item.interest);
          break;
        }
      }
    }

    return {
      roles: Array.from(roles),
      interests: Array.from(interests),
    };
  }

  /**
   * Stipend / Expected salary extraction
   */
  private static extractStipend(text: string, lang: 'ta' | 'kn' | 'hi' | 'en'): string | undefined {
    // Look for numbers followed by k, ஆயிரம், ಸಾವಿರ, per month, etc.
    const stipendMatch = text.match(/(?:stipend|salary|மாதம்|ತಿಂಗಳಿಗೆ|रुपये|rs\.?|₹)\s*[:=]?\s*([0-9]{4,6})/i) ||
      text.match(/([0-9]{1,2})\s*(?:k|lpa|ஆயிரம்|ಸಾವಿರ)/i) ||
      text.match(/([0-9]{4,6})\s*(?:per\s+month|\/month|மாதம்|ತಿಂಗಳಿಗೆ)/i);

    if (stipendMatch) {
      const val = stipendMatch[1];
      if (val.length <= 2) {
        return `₹${val},000/month`;
      }
      return `₹${val}/month`;
    }

    return undefined;
  }

  /**
   * Work experience / Project summary
   */
  private static extractExperience(text: string, lang: 'ta' | 'kn' | 'hi' | 'en'): string | undefined {
    const lower = text.toLowerCase();
    if (
      lower.includes('project') ||
      lower.includes('internship') ||
      lower.includes('experience') ||
      lower.includes('ப்ராஜெக்ட்') ||
      lower.includes('இன்டர்ன்ஷிப்') ||
      lower.includes('ಪ್ರಾಜೆಕ್ಟ್') ||
      lower.includes('ಇಂಟರ್ನ್‌ಶಿಪ್')
    ) {
      // Find sentence containing the keyword
      const sentences = text.split(/[.?!।\n]+/);
      for (const s of sentences) {
        const sLower = s.toLowerCase();
        if (
          sLower.includes('project') ||
          sLower.includes('internship') ||
          sLower.includes('experience') ||
          sLower.includes('ப்ராஜெக்ட்') ||
          sLower.includes('இன்டர்ன்ஷிப்') ||
          sLower.includes('ಪ್ರಾಜೆಕ್ಟ್')
        ) {
          return s.trim().substring(0, 200);
        }
      }
    }

    return undefined;
  }
}
