import { Request, Response } from 'express';
import { VoiceProfileExtractionService } from '../services/voiceProfileExtraction.service.js';
import { ApiResponse } from '../types/index.js';

export const extractVoiceProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcript, language } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSCRIPT',
          message: 'Voice transcript is required for profile extraction.',
        },
      });
      return;
    }

    const validLang = ['ta', 'kn', 'hi', 'en'].includes(language) ? language : undefined;
    const extractedData = VoiceProfileExtractionService.extractProfileFromTranscript(
      transcript,
      validLang as 'ta' | 'kn' | 'hi' | 'en' | undefined
    );

    const response: ApiResponse<typeof extractedData> = {
      success: true,
      data: extractedData,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('[VoiceProfileController] extractVoiceProfile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VOICE_EXTRACTION_FAILED',
        message: error?.message || 'Failed to extract profile from voice transcript.',
      },
    });
  }
};
