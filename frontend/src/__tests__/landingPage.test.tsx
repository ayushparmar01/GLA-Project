import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Hero } from '../components/Hero';
import { ProblemStatement } from '../components/landing/ProblemStatement';
import { PlatformOverview } from '../components/landing/PlatformOverview';
import { CoreFeatures } from '../components/landing/CoreFeatures';
import { HowItWorks } from '../components/landing/HowItWorks';
import { AiIntelligence } from '../components/landing/AiIntelligence';
import { ImpactAccessibility } from '../components/landing/ImpactAccessibility';
import { FinalCta } from '../components/landing/FinalCta';
import { Footer } from '../components/Footer';

describe('Professional Landing Page Redesign Test Suite', () => {
  it('Hero should render official Mission Bharat headline and CTAs', () => {
    const handleJoin = vi.fn();
    render(<Hero onJoin={handleJoin} />);

    expect(screen.getByText(/Bridging the Gap Between/i)).toBeInTheDocument();
    expect(screen.getByText(/Talent and Opportunity./i)).toBeInTheDocument();
    expect(screen.getByText(/MISSION BHARAT HACKATHON/i)).toBeInTheDocument();

    const joinBtn = screen.getByRole('button', { name: /Join CareerBridge/i });
    fireEvent.click(joinBtn);
    expect(handleJoin).toHaveBeenCalledTimes(1);
  });

  it('ProblemStatement should explain the core rural placement divide', () => {
    render(<ProblemStatement />);
    expect(
      screen.getByText(/Opportunity Should Not Depend on Campus Infrastructure/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Limited Placement Cell Infrastructure/i)).toBeInTheDocument();
    expect(screen.getByText(/Geographical Hiring Disconnect/i)).toBeInTheDocument();
  });

  it('PlatformOverview should render 4 distinct stakeholder roles and trigger selection', () => {
    const handleSelectRole = vi.fn();
    render(<PlatformOverview onSelectRole={handleSelectRole} />);

    expect(screen.getByText(/One Platform. Multiple Career Stakeholders./i)).toBeInTheDocument();
    expect(screen.getByText(/For Students/i)).toBeInTheDocument();
    expect(screen.getByText(/For Colleges/i)).toBeInTheDocument();
    expect(screen.getByText(/For Employers/i)).toBeInTheDocument();
    expect(screen.getByText(/For Alumni Mentors/i)).toBeInTheDocument();

    const studentBtn = screen.getByRole('button', { name: /Explore as Student/i });
    fireEvent.click(studentBtn);
    expect(handleSelectRole).toHaveBeenCalledWith('STUDENT');
  });

  it('CoreFeatures should render verified full-stack platform modules', () => {
    render(<CoreFeatures />);
    expect(screen.getByText(/Enterprise-Grade Capabilities/i)).toBeInTheDocument();
    expect(screen.getByText(/Unified Career Profiles & ATS Resumes/i)).toBeInTheDocument();
    expect(screen.getByText(/Explainable AI Job Matching/i)).toBeInTheDocument();
    expect(screen.getByText(/Pooled Campus Drives & Pipelines/i)).toBeInTheDocument();
  });

  it('HowItWorks should render 4 horizontal progression steps', () => {
    const handleStart = vi.fn();
    render(<HowItWorks onGetStarted={handleStart} />);

    expect(screen.getByText(/From Skills to Career Opportunities/i)).toBeInTheDocument();
    expect(screen.getByText(/01/i)).toBeInTheDocument();
    expect(screen.getByText(/Build Your Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/02/i)).toBeInTheDocument();
    expect(screen.getByText(/Discover Opportunities/i)).toBeInTheDocument();
    expect(screen.getByText(/03/i)).toBeInTheDocument();
    expect(screen.getByText(/Develop Your Skills/i)).toBeInTheDocument();
    expect(screen.getByText(/04/i)).toBeInTheDocument();
    expect(screen.getByText(/Track Your Progress/i)).toBeInTheDocument();
  });

  it('AiIntelligence should showcase explainable intelligence and ethics transparency', () => {
    render(<AiIntelligence />);
    expect(screen.getByText(/Actionable Career Intelligence, Grounded in Real Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Transparency Disclosure/i)).toBeInTheDocument();
  });

  it('ImpactAccessibility should highlight non-metro focus and low-bandwidth resilience', () => {
    render(<ImpactAccessibility />);
    expect(screen.getByText(/Designed for Wider Access to Career Opportunities/i)).toBeInTheDocument();
    expect(screen.getByText(/Beyond Metropolitan Campuses/i)).toBeInTheDocument();
    expect(screen.getByText(/Low-Bandwidth & PWA Offline Resilience/i)).toBeInTheDocument();
  });

  it('FinalCta should render action buttons and trigger role registration', () => {
    const handleSelectRole = vi.fn();
    render(<FinalCta onSelectRole={handleSelectRole} />);

    expect(screen.getByText(/Your Potential Deserves a Path Forward/i)).toBeInTheDocument();
    const joinStudentBtn = screen.getByRole('button', { name: /Join as Student/i });
    fireEvent.click(joinStudentBtn);
    expect(handleSelectRole).toHaveBeenCalledWith('STUDENT');
  });

  it('Footer should render clean multi-column layout without outdated labels or fake claims', () => {
    render(<Footer />);
    expect(screen.getByText(/Problem Statement #07 — Career Access for Colleges with No Placement Cell/i)).toBeInTheDocument();
    expect(screen.queryByText(/Phase 1: Project Foundation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Empowering 35,000\+ Indian colleges/i)).not.toBeInTheDocument();
  });
});
