import { MatchingWeightsConfig, RecommendationConfigurationData } from '../types/index.js';
import { RecommendationConfiguration } from '../models/recommendationConfiguration.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { getDbStatus } from '../config/db.js';

export class RecommendationConfigurationService {
  public static readonly DEFAULT_WEIGHTS: MatchingWeightsConfig = {
    skills: 35,
    education: 20,
    assessment: 15,
    experience: 10,
    location: 10,
    rolePreference: 10,
  };

  /**
   * Fetch current matching weights configuration from database or fallback to defaults.
   */
  public static async getConfiguration(): Promise<RecommendationConfigurationData> {
    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      try {
        const config = await RecommendationConfiguration.findOne().sort({ updatedAt: -1 });
        if (config) {
          return config.toSafeObject();
        }
      } catch {
        // Fallback to default
      }
    }

    return {
      scoringWeights: { ...this.DEFAULT_WEIGHTS },
      scoringVersion: 'v13.0',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update matching weights configuration with strict sum-to-100 validation.
   */
  public static async updateConfiguration(
    newWeights: Partial<MatchingWeightsConfig>,
    updatedByUserId?: string
  ): Promise<RecommendationConfigurationData> {
    const current = await this.getConfiguration();
    const merged: MatchingWeightsConfig = {
      skills: newWeights.skills !== undefined ? Number(newWeights.skills) : current.scoringWeights.skills,
      education: newWeights.education !== undefined ? Number(newWeights.education) : current.scoringWeights.education,
      assessment: newWeights.assessment !== undefined ? Number(newWeights.assessment) : current.scoringWeights.assessment,
      experience: newWeights.experience !== undefined ? Number(newWeights.experience) : current.scoringWeights.experience,
      location: newWeights.location !== undefined ? Number(newWeights.location) : current.scoringWeights.location,
      rolePreference: newWeights.rolePreference !== undefined ? Number(newWeights.rolePreference) : current.scoringWeights.rolePreference,
    };

    // Check individual weights bounds (0 to 100)
    for (const [key, val] of Object.entries(merged)) {
      if (typeof val !== 'number' || isNaN(val) || val < 0 || val > 100) {
        throw new Error(`Weight '${key}' must be a valid number between 0 and 100.`);
      }
    }

    // Validate sum
    const total =
      merged.skills +
      merged.education +
      merged.assessment +
      merged.experience +
      merged.location +
      merged.rolePreference;

    if (Math.round(total) !== 100) {
      throw new Error(`Scoring weights must sum exactly to 100%. Provided total is ${total}%.`);
    }

    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      try {
        let configDoc = await RecommendationConfiguration.findOne().sort({ updatedAt: -1 });
        if (!configDoc) {
          configDoc = new RecommendationConfiguration({
            scoringWeights: merged,
            scoringVersion: 'v13.0',
            updatedBy: updatedByUserId,
          });
        } else {
          configDoc.scoringWeights = merged;
          if (updatedByUserId) {
            configDoc.updatedBy = updatedByUserId as any;
          }
        }

        await configDoc.save();

        // Audit log the configuration change
        if (updatedByUserId) {
          try {
            await AuditLog.create({
              actorId: updatedByUserId,
              actorRole: 'ADMIN',
              action: 'UPDATE_RECOMMENDATION_WEIGHTS',
              resourceType: 'RECOMMENDATION_CONFIGURATION',
              resourceId: (configDoc._id as any).toString(),
              metadata: {
                previousWeights: current.scoringWeights,
                newWeights: merged,
              },
            });
          } catch {
            // Non-blocking audit failure
          }
        }

        return configDoc.toSafeObject();
      } catch (err: any) {
        if (err.message && err.message.includes('100%')) {
          throw err;
        }
        // Fallback for transient errors
      }
    }

    return {
      scoringWeights: merged,
      scoringVersion: 'v13.0',
      updatedBy: updatedByUserId,
      updatedAt: new Date().toISOString(),
    };
  }
}
