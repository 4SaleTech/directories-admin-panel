/**
 * Logo Generation Service
 * Generates business logos using external API
 */

export interface LogoGenerationResponse {
  logo_url: string;
}

export class LogoGenerationService {
  private static instance: LogoGenerationService;
  private apiUrl = 'https://icon-generator-six.vercel.app/api/fetch-and-upload-logo';

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
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country,
          business_name: businessName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Logo generation failed: ${response.statusText}`);
      }

      const data: LogoGenerationResponse = await response.json();

      if (!data.logo_url) {
        throw new Error('No logo URL returned from API');
      }

      return data.logo_url;
    } catch (error) {
      console.error('Error generating logo:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const logoGenerationService = LogoGenerationService.getInstance();
