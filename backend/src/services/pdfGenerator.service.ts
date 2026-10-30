import PDFDocument from 'pdfkit';
import { ResumeData, ResumeStructuredContent, ResumeTemplate } from '../types/index.js';

export function generateResumePdf(resume: ResumeData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: resume.title,
          Author: resume.structuredContent.personalInfo.fullName || 'Student',
          Subject: 'Resume - CareerBridge',
          Keywords: 'resume, careerbridge, bharat, placement',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const content = resume.structuredContent;
      const template = resume.template;

      if (template === 'MODERN') {
        renderModernTemplate(doc, content);
      } else if (template === 'PROFESSIONAL') {
        renderProfessionalTemplate(doc, content);
      } else {
        renderMinimalTemplate(doc, content);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ----------------------------------------------------
// 1. MODERN ATS TEMPLATE
// ----------------------------------------------------
function renderModernTemplate(doc: PDFKit.PDFDocument, content: ResumeStructuredContent) {
  const { personalInfo, education, technicalSkills, softSkills, projects, experience, certifications, achievements, visibleSections } = content;

  // Header Banner
  doc.rect(40, 40, doc.page.width - 80, 4).fill('#2563eb'); // Brand blue line
  doc.moveDown(0.8);

  // Full Name
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#1e293b').text(personalInfo.fullName || 'Career Candidate', { align: 'left' });
  
  // Headline
  if (personalInfo.headline) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2563eb').text(personalInfo.headline, { align: 'left' });
  }

  // Contact Info Line
  const contactParts: string[] = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phoneNumber) contactParts.push(personalInfo.phoneNumber);
  if (personalInfo.location) contactParts.push(personalInfo.location);
  if (personalInfo.linkedinUrl) contactParts.push('LinkedIn: ' + personalInfo.linkedinUrl);
  if (personalInfo.githubUrl) contactParts.push('GitHub: ' + personalInfo.githubUrl);
  if (personalInfo.portfolioUrl) contactParts.push('Portfolio: ' + personalInfo.portfolioUrl);

  doc.moveDown(0.3);
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text(contactParts.join('  |  '), { align: 'left' });
  doc.moveDown(0.6);

  // Summary
  if (visibleSections?.summary !== false && personalInfo.summary) {
    addModernSectionHeading(doc, 'PROFESSIONAL SUMMARY');
    doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(personalInfo.summary, { lineGap: 2 });
    doc.moveDown(0.6);
  }

  // Skills
  if (visibleSections?.skills !== false && ((technicalSkills && technicalSkills.length > 0) || (softSkills && softSkills.length > 0))) {
    addModernSectionHeading(doc, 'SKILLS & COMPETENCIES');
    if (technicalSkills && technicalSkills.length > 0) {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e293b').text('Technical Skills: ', { continued: true })
        .font('Helvetica').fillColor('#334155').text(technicalSkills.join(', '));
    }
    if (softSkills && softSkills.length > 0) {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e293b').text('Soft Skills: ', { continued: true })
        .font('Helvetica').fillColor('#334155').text(softSkills.join(', '));
    }
    doc.moveDown(0.6);
  }

  // Experience / Internships
  if (visibleSections?.experience !== false && experience && experience.length > 0) {
    addModernSectionHeading(doc, 'EXPERIENCE & INTERNSHIPS');
    experience.forEach((exp) => {
      const dates = [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate].filter(Boolean).join(' - ');
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#1e293b').text(exp.title, { continued: true })
        .font('Helvetica').fillColor('#64748b').text(`  |  ${exp.company}${exp.location ? ` (${exp.location})` : ''}`, { continued: true })
        .font('Helvetica-Oblique').text(dates ? `  —  ${dates}` : '', { align: 'right' });
      if (exp.description) {
        doc.fontSize(9).font('Helvetica').fillColor('#334155').text(exp.description, { lineGap: 1 });
      }
      doc.moveDown(0.4);
    });
    doc.moveDown(0.3);
  }

  // Projects
  if (visibleSections?.projects !== false && projects && projects.length > 0) {
    addModernSectionHeading(doc, 'PROJECT PORTFOLIO');
    projects.forEach((proj) => {
      const projHeader = [proj.title, proj.role ? `(${proj.role})` : ''].filter(Boolean).join(' ');
      const links = [proj.githubUrl ? `GitHub: ${proj.githubUrl}` : '', proj.liveDemoUrl ? `Demo: ${proj.liveDemoUrl}` : ''].filter(Boolean).join('  |  ');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(projHeader, { continued: Boolean(links) });
      if (links) {
        doc.font('Helvetica').fontSize(8.5).fillColor('#2563eb').text(`  [${links}]`);
      }
      if (proj.technologies && proj.technologies.length > 0) {
        doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#64748b').text('Tech: ' + proj.technologies.join(', '));
      }
      if (proj.description) {
        doc.fontSize(9).font('Helvetica').fillColor('#334155').text(proj.description, { lineGap: 1 });
      }
      doc.moveDown(0.4);
    });
    doc.moveDown(0.3);
  }

  // Education
  if (visibleSections?.education !== false && education && education.length > 0) {
    addModernSectionHeading(doc, 'EDUCATION');
    education.forEach((edu) => {
      const yearRange = [edu.startYear, edu.isCurrent ? 'Present' : edu.endYear].filter(Boolean).join(' - ');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(edu.degree + (edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''), { continued: true })
        .font('Helvetica').fillColor('#64748b').text(`  |  ${edu.institution}`, { continued: true })
        .font('Helvetica-Oblique').text(yearRange ? `  —  ${yearRange}` : '', { align: 'right' });
      if (edu.cgpa !== undefined) {
        doc.fontSize(9).font('Helvetica').fillColor('#475569').text(`CGPA / Score: ${edu.cgpa}`);
      }
      doc.moveDown(0.3);
    });
    doc.moveDown(0.3);
  }

  // Certifications & Achievements
  if (visibleSections?.certifications !== false && certifications && certifications.length > 0) {
    addModernSectionHeading(doc, 'CERTIFICATIONS');
    certifications.forEach((cert) => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e293b').text(cert.title, { continued: true })
        .font('Helvetica').fillColor('#64748b').text(`  —  ${cert.issuer}${cert.issueDate ? ` (${cert.issueDate})` : ''}`);
      doc.moveDown(0.2);
    });
  }

  if (visibleSections?.achievements !== false && achievements && achievements.length > 0) {
    addModernSectionHeading(doc, 'HONORS & ACHIEVEMENTS');
    achievements.forEach((ach) => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e293b').text(ach.title, { continued: true })
        .font('Helvetica').fillColor('#334155').text(ach.description ? `: ${ach.description}` : '');
      doc.moveDown(0.2);
    });
  }
}

function addModernSectionHeading(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1d4ed8').text(title);
  doc.rect(40, doc.y + 2, doc.page.width - 80, 0.75).fill('#cbd5e1');
  doc.moveDown(0.4);
}

// ----------------------------------------------------
// 2. PROFESSIONAL ATS TEMPLATE
// ----------------------------------------------------
function renderProfessionalTemplate(doc: PDFKit.PDFDocument, content: ResumeStructuredContent) {
  const { personalInfo, education, technicalSkills, softSkills, projects, experience, certifications, achievements, visibleSections } = content;

  // Centered Traditional Header
  doc.fontSize(20).font('Times-Bold').fillColor('#111827').text((personalInfo.fullName || 'Candidate').toUpperCase(), { align: 'center' });
  if (personalInfo.headline) {
    doc.fontSize(11).font('Times-Roman').fillColor('#374151').text(personalInfo.headline, { align: 'center' });
  }

  const contacts = [
    personalInfo.email,
    personalInfo.phoneNumber,
    personalInfo.location,
    personalInfo.linkedinUrl ? 'LinkedIn' : '',
    personalInfo.githubUrl ? 'GitHub' : '',
    personalInfo.portfolioUrl ? 'Portfolio' : '',
  ].filter(Boolean);

  doc.moveDown(0.2);
  doc.fontSize(9).font('Times-Roman').fillColor('#4b5563').text(contacts.join('  •  '), { align: 'center' });
  doc.moveDown(0.5);

  // Divider
  doc.rect(40, doc.y, doc.page.width - 80, 1).fill('#111827');
  doc.moveDown(0.5);

  // Summary
  if (visibleSections?.summary !== false && personalInfo.summary) {
    addProfessionalSectionHeading(doc, 'PROFESSIONAL SUMMARY');
    doc.fontSize(10).font('Times-Roman').fillColor('#1f2937').text(personalInfo.summary, { lineGap: 2 });
    doc.moveDown(0.5);
  }

  // Experience
  if (visibleSections?.experience !== false && experience && experience.length > 0) {
    addProfessionalSectionHeading(doc, 'WORK EXPERIENCE');
    experience.forEach((exp) => {
      const dates = [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate].filter(Boolean).join(' – ');
      doc.fontSize(10.5).font('Times-Bold').fillColor('#111827').text(exp.title, { continued: true })
        .font('Times-Roman').fillColor('#4b5563').text(` | ${exp.company}`, { continued: true })
        .font('Times-Italic').text(dates ? ` | ${dates}` : '');
      if (exp.description) {
        doc.fontSize(9.5).font('Times-Roman').fillColor('#374151').text(exp.description, { lineGap: 1 });
      }
      doc.moveDown(0.4);
    });
    doc.moveDown(0.2);
  }

  // Education
  if (visibleSections?.education !== false && education && education.length > 0) {
    addProfessionalSectionHeading(doc, 'EDUCATION');
    education.forEach((edu) => {
      const dates = [edu.startYear, edu.isCurrent ? 'Present' : edu.endYear].filter(Boolean).join(' – ');
      doc.fontSize(10.5).font('Times-Bold').fillColor('#111827').text(edu.degree + (edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''), { continued: true })
        .font('Times-Roman').fillColor('#4b5563').text(` | ${edu.institution}`, { continued: true })
        .font('Times-Italic').text(dates ? ` | ${dates}` : '');
      if (edu.cgpa !== undefined) {
        doc.fontSize(9.5).font('Times-Roman').fillColor('#374151').text(`CGPA: ${edu.cgpa}`);
      }
      doc.moveDown(0.3);
    });
    doc.moveDown(0.2);
  }

  // Projects
  if (visibleSections?.projects !== false && projects && projects.length > 0) {
    addProfessionalSectionHeading(doc, 'KEY PROJECTS');
    projects.forEach((proj) => {
      doc.fontSize(10).font('Times-Bold').fillColor('#111827').text(proj.title);
      if (proj.technologies && proj.technologies.length > 0) {
        doc.fontSize(9).font('Times-Italic').fillColor('#4b5563').text('Technologies: ' + proj.technologies.join(', '));
      }
      if (proj.description) {
        doc.fontSize(9.5).font('Times-Roman').fillColor('#374151').text(proj.description, { lineGap: 1 });
      }
      doc.moveDown(0.3);
    });
    doc.moveDown(0.2);
  }

  // Skills
  if (visibleSections?.skills !== false && ((technicalSkills && technicalSkills.length > 0) || (softSkills && softSkills.length > 0))) {
    addProfessionalSectionHeading(doc, 'TECHNICAL & PROFESSIONAL SKILLS');
    if (technicalSkills && technicalSkills.length > 0) {
      doc.fontSize(9.5).font('Times-Bold').fillColor('#111827').text('Technical: ', { continued: true })
        .font('Times-Roman').fillColor('#374151').text(technicalSkills.join(', '));
    }
    if (softSkills && softSkills.length > 0) {
      doc.fontSize(9.5).font('Times-Bold').fillColor('#111827').text('Core Strengths: ', { continued: true })
        .font('Times-Roman').fillColor('#374151').text(softSkills.join(', '));
    }
    doc.moveDown(0.4);
  }

  // Certifications
  if (visibleSections?.certifications !== false && certifications && certifications.length > 0) {
    addProfessionalSectionHeading(doc, 'CERTIFICATIONS');
    certifications.forEach((cert) => {
      doc.fontSize(9.5).font('Times-Roman').fillColor('#111827').text(`• ${cert.title} — ${cert.issuer}`);
    });
  }
}

function addProfessionalSectionHeading(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(10.5).font('Times-Bold').fillColor('#111827').text(title);
  doc.rect(40, doc.y + 1, doc.page.width - 80, 0.5).fill('#9ca3af');
  doc.moveDown(0.4);
}

// ----------------------------------------------------
// 3. MINIMAL ATS TEMPLATE
// ----------------------------------------------------
function renderMinimalTemplate(doc: PDFKit.PDFDocument, content: ResumeStructuredContent) {
  const { personalInfo, education, technicalSkills, softSkills, projects, experience, certifications, achievements, visibleSections } = content;

  // Ultra-clean single column high density layout
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000').text(personalInfo.fullName || 'Candidate');
  if (personalInfo.headline) {
    doc.fontSize(11).font('Helvetica').fillColor('#333333').text(personalInfo.headline);
  }

  const contactList = [personalInfo.email, personalInfo.phoneNumber, personalInfo.location].filter(Boolean);
  if (contactList.length > 0) {
    doc.fontSize(9).font('Helvetica').fillColor('#555555').text(contactList.join(' | '));
  }
  doc.moveDown(0.5);

  if (visibleSections?.summary !== false && personalInfo.summary) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('SUMMARY');
    doc.fontSize(9).font('Helvetica').fillColor('#222222').text(personalInfo.summary, { lineGap: 1 });
    doc.moveDown(0.4);
  }

  if (visibleSections?.skills !== false && ((technicalSkills && technicalSkills.length > 0) || (softSkills && softSkills.length > 0))) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('SKILLS');
    const all = [...(technicalSkills || []), ...(softSkills || [])];
    doc.fontSize(9).font('Helvetica').fillColor('#222222').text(all.join(' • '));
    doc.moveDown(0.4);
  }

  if (visibleSections?.experience !== false && experience && experience.length > 0) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('EXPERIENCE');
    experience.forEach((exp) => {
      const dates = [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate].filter(Boolean).join(' - ');
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#111111').text(`${exp.title} - ${exp.company} (${dates})`);
      if (exp.description) {
        doc.fontSize(8.5).font('Helvetica').fillColor('#333333').text(exp.description);
      }
      doc.moveDown(0.2);
    });
    doc.moveDown(0.2);
  }

  if (visibleSections?.projects !== false && projects && projects.length > 0) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('PROJECTS');
    projects.forEach((proj) => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#111111').text(proj.title);
      if (proj.description) {
        doc.fontSize(8.5).font('Helvetica').fillColor('#333333').text(proj.description);
      }
      doc.moveDown(0.2);
    });
    doc.moveDown(0.2);
  }

  if (visibleSections?.education !== false && education && education.length > 0) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('EDUCATION');
    education.forEach((edu) => {
      const dates = [edu.startYear, edu.isCurrent ? 'Present' : edu.endYear].filter(Boolean).join(' - ');
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#111111').text(`${edu.degree} - ${edu.institution} (${dates})`);
      if (edu.cgpa !== undefined) {
        doc.fontSize(8.5).font('Helvetica').fillColor('#333333').text(`CGPA: ${edu.cgpa}`);
      }
      doc.moveDown(0.2);
    });
  }

  if (visibleSections?.certifications !== false && certifications && certifications.length > 0) {
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('CERTIFICATIONS');
    certifications.forEach((c) => {
      doc.fontSize(8.5).font('Helvetica').fillColor('#333333').text(`• ${c.title} (${c.issuer})`);
    });
  }
}
