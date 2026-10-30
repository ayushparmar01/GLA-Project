import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  isSensitiveStorageKey,
  safeSetLocalStorageItem,
  sanitizePlainText,
  parseRateLimitResponse,
} from '../utils/security';
import {
  cacheResourceOffline,
  getOfflineResource,
  listOfflineResources,
  removeOfflineResource,
} from '../pwa/offlineStorage';
import { handleApiResponse } from '../services/api';

describe('Phase 19 — Advanced Security, Performance & Scalability (Frontend Test Suite)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Sensitive Credential Denylist & Safe LocalStorage Guard', () => {
    it('should detect sensitive credential keys (tokens, passwords, secrets, credentials)', () => {
      expect(isSensitiveStorageKey('cb_token')).toBe(true);
      expect(isSensitiveStorageKey('authToken')).toBe(true);
      expect(isSensitiveStorageKey('userPassword')).toBe(true);
      expect(isSensitiveStorageKey('jwt_secret')).toBe(true);
      expect(isSensitiveStorageKey('session_credential')).toBe(true);
      expect(isSensitiveStorageKey('private_key')).toBe(true);
    });

    it('should permit non-sensitive UI preference and public state keys', () => {
      expect(isSensitiveStorageKey('cb_preferred_language')).toBe(false);
      expect(isSensitiveStorageKey('theme_mode')).toBe(false);
      expect(isSensitiveStorageKey('active_tab')).toBe(false);
      expect(isSensitiveStorageKey('search_query')).toBe(false);
    });

    it('safeSetLocalStorageItem should reject writing sensitive tokens to localStorage', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const success = safeSetLocalStorageItem('cb_auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(success).toBe(false);
      expect(localStorage.getItem('cb_auth_token')).toBeNull();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('safeSetLocalStorageItem should allow persisting harmless UI state to localStorage', () => {
      const success = safeSetLocalStorageItem('cb_preferred_lang', 'hi');
      expect(success).toBe(true);
      expect(localStorage.getItem('cb_preferred_lang')).toBe('hi');
    });
  });

  describe('2. PWA Offline Storage Guard with Token Filtering', () => {
    it('should safely cache public learning and career resources for offline access', () => {
      const resourceData = {
        title: 'Full Stack Web Development Curriculum',
        modules: 12,
        durationWeeks: 8,
      };

      const cached = cacheResourceOffline(
        'path_101',
        'learning',
        'Full Stack Roadmap',
        resourceData
      );

      expect(cached).toBe(true);
      const retrieved = getOfflineResource('path_101');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('Full Stack Roadmap');
      expect(retrieved?.data.modules).toBe(12);
    });

    it('should reject offline caching if resource ID or title contains sensitive terms', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const blocked = cacheResourceOffline(
        'auth_token_backup',
        'learning',
        'Secret User Token',
        { token: 'secret' }
      );

      expect(blocked).toBe(false);
      expect(getOfflineResource('auth_token_backup')).toBeNull();

      warnSpy.mockRestore();
    });

    it('should block offline caching if payload data contains secret or password keys', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const blocked = cacheResourceOffline(
        'user_profile_draft',
        'roadmap',
        'Draft Profile',
        { name: 'Student', password: 'SecretPassword123' }
      );

      expect(blocked).toBe(false);
      warnSpy.mockRestore();
    });

    it('should list and remove cached offline resources correctly', () => {
      cacheResourceOffline('res_1', 'skill', 'React Fundamentals', { level: 'Beginner' });
      cacheResourceOffline('res_2', 'event', 'Virtual Job Fair', { date: '2026-11-15' });

      const allResources = listOfflineResources();
      expect(allResources.length).toBe(2);

      const removed = removeOfflineResource('res_1');
      expect(removed).toBe(true);
      expect(getOfflineResource('res_1')).toBeNull();
      expect(listOfflineResources().length).toBe(1);
    });
  });

  describe('3. Plain Text XSS Sanitization in Rendered Output', () => {
    it('should strip script tags and HTML elements from user strings', () => {
      const dirty = '<script>alert("hacked")</script><b>Senior Software Engineer</b>';
      const clean = sanitizePlainText(dirty);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<b>');
      expect(clean).toBe('Senior Software Engineer');
    });

    it('should neutralize javascript: pseudo-protocols', () => {
      const input = 'Click here: javascript:alert(1)';
      const clean = sanitizePlainText(input);

      expect(clean).not.toContain('javascript:');
      expect(clean).toContain('blocked:');
    });

    it('should gracefully handle empty or undefined strings', () => {
      expect(sanitizePlainText('')).toBe('');
      expect(sanitizePlainText(null as any)).toBe('');
      expect(sanitizePlainText(undefined as any)).toBe('');
    });
  });

  describe('4. Rate Limiting Response Parser & Error Handling', () => {
    it('parseRateLimitResponse should extract Retry-After header and custom error message', () => {
      const mockHeaders = new Headers();
      mockHeaders.set('Retry-After', '45');

      const mockResponse = new Response(JSON.stringify({
        success: false,
        error: { message: 'Too many ATS resume scans. Please wait.' },
      }), {
        status: 429,
        headers: mockHeaders,
      });

      const parsed = parseRateLimitResponse(mockResponse, {
        error: { message: 'Too many ATS resume scans. Please wait.' },
      });

      expect(parsed.isRateLimited).toBe(true);
      expect(parsed.retryAfterSeconds).toBe(45);
      expect(parsed.message).toBe('Too many ATS resume scans. Please wait.');
    });

    it('parseRateLimitResponse should default to 60 seconds if Retry-After header is missing', () => {
      const mockResponse = new Response('{}', { status: 429 });
      const parsed = parseRateLimitResponse(mockResponse);

      expect(parsed.isRateLimited).toBe(true);
      expect(parsed.retryAfterSeconds).toBe(60);
      expect(parsed.message).toContain('60 seconds');
    });

    it('handleApiResponse should throw informative error when status is 429 Too Many Requests', async () => {
      const mockHeaders = new Headers({ 'Retry-After': '30' });
      const mockResponse = new Response(
        JSON.stringify({
          error: { message: 'AI inference rate limit exceeded. Please wait 30 seconds.' },
        }),
        {
          status: 429,
          headers: mockHeaders,
        }
      );

      await expect(handleApiResponse(mockResponse)).rejects.toThrow(
        'AI inference rate limit exceeded. Please wait 30 seconds.'
      );
    });

    it('handleApiResponse should successfully parse JSON payload on 200 OK responses', async () => {
      const mockResponse = new Response(
        JSON.stringify({ success: true, data: { status: 'healthy' } }),
        { status: 200 }
      );

      const data = await handleApiResponse(mockResponse);
      expect(data).toEqual({ success: true, data: { status: 'healthy' } });
    });
  });
});
