import zlib from 'zlib';
import crypto from 'crypto';
import {
  ResumeDocumentFileType,
  ExtractedStructuredResume,
  ExtractedResumeContact,
  ExtractedEducationItem,
  ExtractedExperienceItem,
  ExtractedProjectItem,
  ExtractedCertificationItem,
} from '../types/index.js';

export class ResumeDocumentParserService {
  /**
   * Validates document file extension and magic bytes.
   */
  public static validateDocument(
    buffer: Buffer,
    fileName: string
  ): { valid: boolean; fileType: ResumeDocumentFileType; error?: string } {
    if (!buffer || buffer.length === 0) {
      return { valid: false, fileType: 'PDF', error: 'Uploaded file is empty.' };
    }

    if (buffer.length > 5 * 1024 * 1024) {
      return {
        valid: false,
        fileType: 'PDF',
        error: 'File size exceeds maximum allowed limit of 5MB.',
      };
    }

    const lowerName = fileName.toLowerCase().trim();

    // Check PDF magic bytes (%PDF-)
    if (
      buffer.length >= 5 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46 &&
      buffer[4] === 0x2d
    ) {
      return { valid: true, fileType: 'PDF' };
    }

    // Check DOCX magic bytes (ZIP header: PK\x03\x04)
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    ) {
      if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
        return { valid: true, fileType: 'DOCX' };
      }
    }

    // Check by file extension fallback if buffer header matches ASCII text / pdf
    if (lowerName.endsWith('.pdf')) {
      const headerSample = buffer.slice(0, 32).toString('latin1');
      if (headerSample.includes('%PDF')) {
        return { valid: true, fileType: 'PDF' };
      }
    }

    return {
      valid: false,
      fileType: 'PDF',
      error:
        'Unsupported or corrupted document format. Please upload a valid PDF or DOCX resume document.',
    };
  }

  /**
   * Generates a unique, non-path-traversable secure storage reference.
   */
  public static generateSecureStorageReference(studentId: string, fileName: string): string {
    const timestamp = Date.now();
    const hash = crypto
      .createHash('sha256')
      .update(`${studentId}-${fileName}-${timestamp}-${crypto.randomBytes(16).toString('hex')}`)
      .digest('hex')
      .substring(0, 32);
    return `sec_doc_${hash}`;
  }

  /**
   * Extracts raw text from PDF or DOCX buffer.
   */
  public static extractRawText(
    buffer: Buffer,
    fileType: ResumeDocumentFileType
  ): { text: string; isScannedOrEmpty: boolean } {
    if (fileType === 'DOCX') {
      return this.extractTextFromDocx(buffer);
    }
    return this.extractTextFromPdf(buffer);
  }

  /**
   * Resilient pure Node.js PDF text extractor.
   * Extracts text from uncompressed text operators and decompressable FlateDecode streams.
   */
  private static extractTextFromPdf(buffer: Buffer): { text: string; isScannedOrEmpty: boolean } {
    const extractedChunks: string[] = [];
    const binaryString = buffer.toString('latin1');

    // 1. Search for stream ... endstream blocks
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(binaryString)) !== null) {
      const streamData = match[1];
      const streamBuffer = Buffer.from(streamData, 'latin1');

      // Attempt zlib inflation (FlateDecode)
      let decompressed: Buffer | null = null;
      try {
        decompressed = zlib.inflateSync(streamBuffer);
      } catch {
        try {
          decompressed = zlib.inflateRawSync(streamBuffer);
        } catch {
          // Stream might be uncompressed or use unsupported filter
        }
      }

      const contentToScan = decompressed ? decompressed.toString('latin1') : streamData;
      const textFromOperators = this.parsePdfTextOperators(contentToScan);
      if (textFromOperators) {
        extractedChunks.push(textFromOperators);
      }
    }

    // 2. Direct string literal fallback across full document
    if (extractedChunks.length === 0) {
      const directText = this.parsePdfTextOperators(binaryString);
      if (directText) {
        extractedChunks.push(directText);
      }
    }

    const combinedText = extractedChunks
      .join('\n')
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[^\x20-\x7E\n]/g, ' ') // Clean non-printable
      .replace(/ +/g, ' ')
      .trim();

    if (!combinedText || combinedText.length < 30) {
      return {
        text: combinedText,
        isScannedOrEmpty: true,
      };
    }

    return {
      text: combinedText,
      isScannedOrEmpty: false,
    };
  }

  /**
   * Parses PDF text operators (Tj, TJ, ', ") inside BT ... ET blocks.
   */
  private static parsePdfTextOperators(content: string): string {
    const lines: string[] = [];

    // Match text blocks BT ... ET
    const btRegex = /BT([\s\S]*?)ET/g;
    let btMatch: RegExpExecArray | null;

    while ((btMatch = btRegex.exec(content)) !== null) {
      const blockContent = btMatch[1];

      // Handle TJ array syntax: [(Hello ) 10 (World)] TJ
      const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjArrayRegex.exec(blockContent)) !== null) {
        const arrayParts = tjMatch[1];
        const stringParts = arrayParts.match(/\((.*?)\)/g);
        if (stringParts) {
          const joined = stringParts.map((s) => s.slice(1, -1)).join('');
          lines.push(this.decodePdfString(joined));
        }
      }

      // Handle Tj single string syntax: (Hello World) Tj
      const tjSingleRegex = /\(([\s\S]*?)\)\s*Tj/g;
      let singleMatch: RegExpExecArray | null;
      while ((singleMatch = tjSingleRegex.exec(blockContent)) !== null) {
        lines.push(this.decodePdfString(singleMatch[1]));
      }
    }

    // If no BT blocks, extract parenthesized strings
    if (lines.length === 0) {
      const parenRegex = /\(([A-Za-z0-9\s.,!?:;@#%&'"+_\-/()]{4,})\)/g;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = parenRegex.exec(content)) !== null) {
        lines.push(this.decodePdfString(pMatch[1]));
      }
    }

    return lines.join(' ');
  }

  private static decodePdfString(str: string): string {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Resilient pure Node.js DOCX text extractor.
   * Scans zip structures for word/document.xml and extracts <w:t> tags.
   */
  private static extractTextFromDocx(buffer: Buffer): { text: string; isScannedOrEmpty: boolean } {
    try {
      let documentXml = '';
      const binary = buffer.toString('latin1');
      const filename = 'word/document.xml';
      const filePos = binary.indexOf(filename);

      if (filePos !== -1) {
        // Zip local header check
        const headerStart = filePos - 26;
        if (headerStart >= 0) {
          const compMethod = buffer.readUInt16LE(headerStart + 4);
          const compSize = buffer.readUInt32LE(headerStart + 14);
          const filenameLen = buffer.readUInt16LE(headerStart + 22);
          const extraLen = buffer.readUInt16LE(headerStart + 24);
          const dataOffset = headerStart + 26 + filenameLen + extraLen;

          if (dataOffset + compSize <= buffer.length) {
            const fileData = buffer.slice(dataOffset, dataOffset + compSize);
            if (compMethod === 8) {
              // Deflated
              try {
                documentXml = zlib.inflateRawSync(fileData).toString('utf8');
              } catch {
                try {
                  documentXml = zlib.inflateSync(fileData).toString('utf8');
                } catch {
                  // Fallback
                }
              }
            } else if (compMethod === 0) {
              // Stored uncompressed
              documentXml = fileData.toString('utf8');
            }
          }
        }
      }

      // If header parsing failed, perform stream scanning
      if (!documentXml) {
        const xmlChunks = binary.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
        if (xmlChunks) {
          documentXml = xmlChunks.join(' ');
        }
      }

      if (documentXml) {
        // Replace paragraph ends with newlines
        let text = documentXml
          .replace(/<\/w:p>/g, '\n')
          .replace(/<w:br\/>/g, '\n')
          .replace(/<w:tab\/>/g, ' ')
          .replace(/<[^>]+>/g, '') // Strip remaining tags
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/\n\s*\n/g, '\n')
          .trim();

        if (text.length >= 30) {
          return { text, isScannedOrEmpty: false };
        }
      }

      return { text: '', isScannedOrEmpty: true };
    } catch {
      return { text: '', isScannedOrEmpty: true };
    }
  }

  /**
   * Parses raw extracted resume text into structured fields.
   */
  public static parseStructuredFields(rawText: string): ExtractedStructuredResume {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const contact = this.extractContactInfo(rawText, lines);
    const technicalSkills = this.extractTechnicalSkills(rawText);
    const softSkills = this.extractSoftSkills(rawText);
    const education = this.extractEducation(rawText, lines);
    const workExperience = this.extractExperience(rawText, lines);
    const projects = this.extractProjects(rawText, lines);
    const certifications = this.extractCertifications(rawText, lines);
    const achievements = this.extractAchievements(rawText, lines);

    return {
      contact,
      education,
      technicalSkills,
      softSkills,
      workExperience,
      projects,
      certifications,
      achievements,
      rawTextLength: rawText.length,
    };
  }

  private static extractContactInfo(rawText: string, lines: string[]): ExtractedResumeContact {
    const contact: ExtractedResumeContact = {};

    // 1. Email Regex
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      contact.email = emailMatch[0].toLowerCase();
    }

    // 2. Phone Regex (10 digits or international format)
    const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?\d{10}|\b\d{10}\b/);
    if (phoneMatch) {
      contact.phone = phoneMatch[0].trim();
    }

    // 3. LinkedIn URL
    const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[a-zA-Z0-9_-]+/i);
    if (linkedinMatch) {
      contact.linkedinUrl = linkedinMatch[0];
    }

    // 4. GitHub URL
    const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
    if (githubMatch) {
      contact.githubUrl = githubMatch[0];
    }

    // 5. Portfolio URL
    const portfolioMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9_-]+\.(?:vercel\.app|netlify\.app|github\.io|dev|io|me|in|com)\b(?!\/linkedin|\/github)/i);
    if (portfolioMatch) {
      contact.portfolioUrl = portfolioMatch[0];
    }

    // 6. Name: usually the first non-trivial line not containing email/url/digits
    for (const line of lines.slice(0, 5)) {
      if (
        !line.includes('@') &&
        !line.toLowerCase().includes('http') &&
        !line.toLowerCase().includes('linkedin') &&
        !line.toLowerCase().includes('resume') &&
        !line.toLowerCase().includes('curriculum') &&
        !/\d{5,}/.test(line) &&
        line.length >= 3 &&
        line.length <= 40
      ) {
        contact.fullName = line;
        break;
      }
    }

    // 7. Summary / Career Objective
    const summaryMatch = rawText.match(/(?:summary|career\s+objective|profile\s+summary|about\s+me)[:\s\n]+([^]{40,400}?)(?:\n\s*(?:education|skills|experience|projects|certifications)\b)/i);
    if (summaryMatch) {
      contact.summary = summaryMatch[1].replace(/\n+/g, ' ').trim();
    }

    return contact;
  }

  private static extractTechnicalSkills(rawText: string): string[] {
    const knownSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart',
      'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Express.js', 'Nest.js', 'Django', 'Flask', 'Spring Boot',
      'HTML', 'HTML5', 'CSS', 'CSS3', 'Tailwind', 'Tailwind CSS', 'Bootstrap', 'Sass',
      'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Firebase', 'Oracle', 'Cassandra',
      'Docker', 'Kubernetes', 'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP', 'CI/CD', 'Linux', 'Git', 'GitHub',
      'REST APIs', 'GraphQL', 'gRPC', 'WebSockets', 'Microservices', 'System Design',
      'Data Structures', 'Algorithms', 'DSA', 'OOP', 'Object Oriented Programming', 'DBMS',
      'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy', 'Scikit-Learn',
    ];

    const matched = new Set<string>();
    const lowerText = ` ${rawText.toLowerCase().replace(/[^a-z0-9.+#]/g, ' ')} `;

    for (const skill of knownSkills) {
      const lowerSkill = skill.toLowerCase();
      const escapedSkill = lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-z0-9.+#])${escapedSkill}(?:$|[^a-z0-9.+#])`, 'i');
      if (regex.test(lowerText)) {
        matched.add(skill);
      }
    }

    return Array.from(matched);
  }

  private static extractSoftSkills(rawText: string): string[] {
    const knownSoftSkills = [
      'Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Critical Thinking',
      'Time Management', 'Adaptability', 'Collaboration', 'Work Ethic', 'Attention to Detail',
      'Empathy', 'Conflict Resolution', 'Active Listening', 'Agile Methodologies',
    ];

    const matched = new Set<string>();
    const lowerText = rawText.toLowerCase();

    for (const skill of knownSoftSkills) {
      if (lowerText.includes(skill.toLowerCase())) {
        matched.add(skill);
      }
    }

    return Array.from(matched);
  }

  private static extractEducation(rawText: string, lines: string[]): ExtractedEducationItem[] {
    const items: ExtractedEducationItem[] = [];
    const eduIndex = lines.findIndex((l) => /^(education|academic\s+background|academics)\b/i.test(l));

    if (eduIndex !== -1) {
      const relevantLines = lines.slice(eduIndex + 1, eduIndex + 12);
      let currentDegree = '';
      let currentInst = '';
      let currentYear = '';
      let currentCgpa = '';

      for (const line of relevantLines) {
        if (/^(skills|experience|projects|certifications|achievements)\b/i.test(line)) {
          break;
        }

        // Degree matching
        if (/(b\.?tech|b\.?e\.?|bca|mca|b\.?sc|m\.?tech|bachelor|master|diploma|higher\s+secondary)/i.test(line)) {
          currentDegree = line;
        } else if (/(college|university|institute|school|academy)/i.test(line)) {
          currentInst = line;
        }

        // Year matching (e.g. 2021 - 2025 or 2024)
        const yearMatch = line.match(/\b(20\d{2})\s*(?:-|to)?\s*(20\d{2}|present)?\b/i);
        if (yearMatch) {
          currentYear = yearMatch[0];
        }

        // CGPA matching
        const cgpaMatch = line.match(/(?:cgpa|gpa|percentage)[:\s]+(\d+(?:\.\d+)?(?:\s*\/\s*10|\s*%)?)/i);
        if (cgpaMatch) {
          currentCgpa = cgpaMatch[1];
        }
      }

      if (currentDegree || currentInst) {
        items.push({
          institution: currentInst || 'Undergraduate Institution',
          degree: currentDegree || 'Bachelor of Technology',
          startYear: currentYear.split('-')[0]?.trim(),
          endYear: currentYear.split('-')[1]?.trim() || currentYear,
          cgpa: currentCgpa,
        });
      }
    }

    if (items.length === 0) {
      // General degree regex fallback
      const degreeMatch = rawText.match(/\b(B\.?Tech|B\.?E\.?|BCA|MCA|M\.?Tech|B\.?Sc)\b[^\n.]{0,80}/i);
      if (degreeMatch) {
        items.push({
          institution: 'Institutional Degree Program',
          degree: degreeMatch[0].trim(),
        });
      }
    }

    return items;
  }

  private static extractExperience(rawText: string, lines: string[]): ExtractedExperienceItem[] {
    const items: ExtractedExperienceItem[] = [];
    const expIndex = lines.findIndex((l) => /^(experience|work\s+experience|internships|employment)\b/i.test(l));

    if (expIndex !== -1) {
      const relevantLines = lines.slice(expIndex + 1, expIndex + 25);
      let currentItem: ExtractedExperienceItem | null = null;

      for (const line of relevantLines) {
        if (/^(projects|skills|education|certifications|achievements)\b/i.test(line)) {
          break;
        }

        // Check if line looks like a job title or company
        if (/(intern|developer|engineer|analyst|associate|lead|trainee)\b/i.test(line) && !line.startsWith('•') && !line.startsWith('-')) {
          if (currentItem) {
            items.push(currentItem);
          }
          currentItem = {
            role: line,
            company: 'Tech Organization',
            bullets: [],
          };
        } else if (currentItem) {
          if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            currentItem.bullets.push(line.replace(/^[•\-*]\s*/, '').trim());
          } else if (line.length > 25 && currentItem.bullets.length < 5) {
            currentItem.bullets.push(line);
          }
        }
      }

      if (currentItem) {
        items.push(currentItem);
      }
    }

    return items;
  }

  private static extractProjects(rawText: string, lines: string[]): ExtractedProjectItem[] {
    const items: ExtractedProjectItem[] = [];
    const projIndex = lines.findIndex((l) => /^(projects|academic\s+projects|personal\s+projects)\b/i.test(l));

    if (projIndex !== -1) {
      const relevantLines = lines.slice(projIndex + 1, projIndex + 30);
      let currentItem: ExtractedProjectItem | null = null;

      for (const line of relevantLines) {
        if (/^(experience|skills|education|certifications|achievements)\b/i.test(line)) {
          break;
        }

        if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*') && line.length < 60 && !line.toLowerCase().includes('http')) {
          if (currentItem) {
            items.push(currentItem);
          }
          currentItem = {
            title: line,
            technologies: [],
            bullets: [],
          };
        } else if (currentItem) {
          if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            currentItem.bullets.push(line.replace(/^[•\-*]\s*/, '').trim());
          } else if (line.length > 20 && currentItem.bullets.length < 4) {
            currentItem.bullets.push(line);
          }
        }
      }

      if (currentItem) {
        items.push(currentItem);
      }
    }

    return items;
  }

  private static extractCertifications(rawText: string, lines: string[]): ExtractedCertificationItem[] {
    const items: ExtractedCertificationItem[] = [];
    const certIndex = lines.findIndex((l) => /^(certifications|licenses\s+&\s+certifications|certificates)\b/i.test(l));

    if (certIndex !== -1) {
      const relevantLines = lines.slice(certIndex + 1, certIndex + 10);
      for (const line of relevantLines) {
        if (/^(experience|projects|skills|education|achievements)\b/i.test(line)) {
          break;
        }
        if (line.length > 5) {
          items.push({
            name: line.replace(/^[•\-*]\s*/, '').trim(),
          });
        }
      }
    }

    return items;
  }

  private static extractAchievements(rawText: string, lines: string[]): string[] {
    const items: string[] = [];
    const achIndex = lines.findIndex((l) => /^(achievements|awards|honors|extracurricular)\b/i.test(l));

    if (achIndex !== -1) {
      const relevantLines = lines.slice(achIndex + 1, achIndex + 10);
      for (const line of relevantLines) {
        if (/^(experience|projects|skills|education|certifications)\b/i.test(line)) {
          break;
        }
        if (line.length > 5) {
          items.push(line.replace(/^[•\-*]\s*/, '').trim());
        }
      }
    }

    return items;
  }
}
