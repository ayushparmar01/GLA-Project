import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLearningResourcesApi } from '../services/api';

describe('fetchLearningResourcesApi Function & Integration', () => {
  const mockFetch = vi.fn();
  vi.stubGlobal('fetch', mockFetch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export a single valid fetchLearningResourcesApi function', () => {
    expect(fetchLearningResourcesApi).toBeDefined();
    expect(typeof fetchLearningResourcesApi).toBe('function');
  });

  it('should call /learning/resources with empty query when called with no parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [{ id: 'res-1', title: 'React Documentation', category: 'Web Development' }],
      }),
    });

    const result = await fetchLearningResourcesApi();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('/learning/resources');
  });

  it('should properly format all query parameters including legacy isFree, skill, and search', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    await fetchLearningResourcesApi({
      category: 'Web Development',
      resourceType: 'Documentation',
      difficulty: 'BEGINNER',
      skill: 'TypeScript',
      isFree: true,
      search: 'react state',
      verificationStatus: 'VERIFIED',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('category=Web+Development');
    expect(calledUrl).toContain('resourceType=Documentation');
    expect(calledUrl).toContain('difficulty=BEGINNER');
    expect(calledUrl).toContain('skill=TypeScript');
    expect(calledUrl).toContain('isFree=true');
    expect(calledUrl).toContain('search=react+state');
    expect(calledUrl).toContain('verificationStatus=VERIFIED');
  });

  it('should attach authentication headers and include credentials when token is supplied', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    await fetchLearningResourcesApi({}, 'fake-jwt-token-12345');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const options = mockFetch.mock.calls[0][1];
    expect(options.credentials).toBe('include');
    expect(options.headers).toMatchObject({
      Authorization: 'Bearer fake-jwt-token-12345',
    });
  });

  it('should gracefully handle network failure and return standardized ApiResponse error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network connection timeout'));

    const result = await fetchLearningResourcesApi();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('NETWORK_ERROR');
    expect(result.error?.message).toContain('Network connection timeout');
  });
});
