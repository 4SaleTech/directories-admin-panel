/**
 * Social Media Fetch Service
 * Fetches business social media links using backend API proxy
 */

import { adminApiClient } from '../api/adminApiClient';

export interface SocialMediaLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface SocialMediaFetchResponse {
  business_name: string;
  confidence: string;
  country: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  snapchat?: string;
  whatsapp?: string;
  website?: string;
  sources?: string[];
}

export class SocialMediaFetchService {
  private static instance: SocialMediaFetchService;

  private constructor() {}

  static getInstance(): SocialMediaFetchService {
    if (!SocialMediaFetchService.instance) {
      SocialMediaFetchService.instance = new SocialMediaFetchService();
    }
    return SocialMediaFetchService.instance;
  }

  /**
   * Fetch social media links for a business
   * @param businessName - Name of the business
   * @param country - Country (default: 'Kuwait')
   * @returns Promise<SocialMediaLink[]> - Array of found social media links
   */
  async fetchSocialMedia(businessName: string, country: string = 'Kuwait'): Promise<SocialMediaLink[]> {
    try {
      const response = await adminApiClient.post<SocialMediaFetchResponse>(
        '/admin/businesses/fetch-social-media',
        {
          business_name: businessName,
          country,
        }
      );

      if (!response) {
        throw new Error('No response from API');
      }

      // Transform response into array of social media links
      const links: SocialMediaLink[] = [];

      const platformMapping: Record<string, string> = {
        facebook: 'Facebook',
        instagram: 'Instagram',
        twitter: 'Twitter',
        linkedin: 'LinkedIn',
        youtube: 'YouTube',
        tiktok: 'TikTok',
        snapchat: 'Snapchat',
        whatsapp: 'WhatsApp',
        website: 'Website',
      };

      Object.entries(platformMapping).forEach(([key, displayName]) => {
        const url = response[key as keyof SocialMediaFetchResponse];
        if (url && typeof url === 'string') {
          links.push({
            platform: displayName,
            url,
          });
        }
      });

      return links;
    } catch (error: any) {
      console.error('Error fetching social media:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch social media');
    }
  }
}

// Export singleton instance
export const socialMediaFetchService = SocialMediaFetchService.getInstance();
