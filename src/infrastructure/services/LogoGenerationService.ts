/**
 * Logo Generation Service
 * Generates business logos using backend API proxy
 */

import { adminApiClient } from '../api/adminApiClient';

export interface LogoGenerationResponse {
  success: boolean;
  logo_url: string;
  platform?: string;
  score?: number;
  size?: string;
  is_square?: boolean;
  source_url?: string;
}

export class LogoGenerationService {
  private static instance: LogoGenerationService;

  private constructor() {}

  static getInstance(): LogoGenerationService {
    if (!LogoGenerationService.instance) {
      LogoGenerationService.instance = new LogoGenerationService();
    }
    return LogoGenerationService.instance;
  }

  /**
   * Generate a logo for a business
   * @param businessName - Name of the business
   * @param country - Country code (default: 'kuwait')
   * @returns Promise<string> - URL of the generated logo
   */
  async generateLogo(businessName: string, country: string = 'kuwait'): Promise<string> {
    try {
      const response = await adminApiClient.post<LogoGenerationResponse>(
        '/admin/businesses/generate-logo',
        {
          business_name: businessName,
          country,
        }
      );

      if (!response.success) {
        throw new Error('Logo generation was not successful');
      }

      if (!response.logo_url) {
        throw new Error('No logo URL returned from API');
      }

      return response.logo_url;
    } catch (error: any) {
      console.error('Error generating logo:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to generate logo');
    }
  }
}

// Export singleton instance
export const logoGenerationService = LogoGenerationService.getInstance();
