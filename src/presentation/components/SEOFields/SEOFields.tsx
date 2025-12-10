'use client';

import { useState } from 'react';
import styles from './SEOFields.module.scss';
import ImageUploader from '../ImageUploader/ImageUploader';

interface SEOFieldsProps {
  // English fields
  pageTitle?: string;
  pageDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;

  // Arabic fields
  pageTitleAr?: string;
  pageDescriptionAr?: string;
  metaTitleAr?: string;
  metaDescriptionAr?: string;
  ogTitleAr?: string;
  ogDescriptionAr?: string;

  onChange: (field: string, value: string) => void;
  showOgFields?: boolean; // For businesses (shows og_title, og_description)
}

export default function SEOFields({
  pageTitle = '',
  pageDescription = '',
  metaTitle = '',
  metaDescription = '',
  ogTitle = '',
  ogDescription = '',
  ogImage = '',
  pageTitleAr = '',
  pageDescriptionAr = '',
  metaTitleAr = '',
  metaDescriptionAr = '',
  ogTitleAr = '',
  ogDescriptionAr = '',
  onChange,
  showOgFields = false,
}: SEOFieldsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ar'>('en');

  const getCharacterCountClass = (current: number, optimal: number, max: number) => {
    if (current === 0) return '';
    if (current > max) return styles.overLimit;
    if (current >= optimal - 10 && current <= optimal + 10) return styles.optimal;
    return styles.warning;
  };

  return (
    <div className={styles.seoFields}>
      <div className={styles.seoHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <h3>SEO Metadata (Optional)</h3>
        <span className={styles.toggle}>{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className={styles.seoContent}>
          <p className={styles.seoHelp}>
            Configure page display content and search engine optimization for both English and Arabic.
          </p>

          {/* Language Tabs */}
          <div className={styles.languageTabs}>
            <button
              type="button"
              className={`${styles.languageTab} ${activeLanguage === 'en' ? styles.active : ''}`}
              onClick={() => setActiveLanguage('en')}
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              className={`${styles.languageTab} ${activeLanguage === 'ar' ? styles.active : ''}`}
              onClick={() => setActiveLanguage('ar')}
            >
              🇰🇼 Arabic
            </button>
          </div>

          {/* English Fields */}
          {activeLanguage === 'en' && (
            <>
              <div className={styles.divider}>
                <span>Page Display (User-Visible) - English</span>
              </div>

              {/* Page Title */}
              <div className="form-group">
                <label>
                  Page Title (User-Visible)
                  <span className={styles.characterCount}>
                    {pageTitle.length} characters (no limit)
                  </span>
                </label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => onChange('page_title', e.target.value)}
                  placeholder="Best Restaurants & Cafes in Kuwait - Complete Directory"
                />
                <small className={styles.helpText}>
                  The main heading (H1) displayed to users on the page. Can be longer and more descriptive than meta title.
                  Falls back to: Meta Title → Name.
                </small>
              </div>

              {/* Page Description */}
              <div className="form-group">
                <label>
                  Page Description (User-Visible)
                  <span className={styles.characterCount}>
                    {pageDescription.length} characters (no limit)
                  </span>
                </label>
                <textarea
                  value={pageDescription}
                  onChange={(e) => onChange('page_description', e.target.value)}
                  placeholder="Explore Kuwait's finest restaurants and cafes with verified reviews, detailed menus, ratings, and contact information. Find your next dining experience."
                  rows={3}
                />
                <small className={styles.helpText}>
                  Visible description shown to users on the page. Can be longer and more detailed than meta description.
                  Falls back to: Meta Description → Description/About.
                </small>
              </div>

              <div className={styles.divider}>
                <span>Search Engine Metadata - English</span>
              </div>

              {/* Meta Title */}
              <div className="form-group">
                <label>
                  Meta Title
                  <span className={styles.characterCount}>
                    <span className={getCharacterCountClass(metaTitle.length, 60, 70)}>
                      {metaTitle.length}
                    </span>
                    /60 characters (optimal)
                  </span>
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => onChange('meta_title', e.target.value)}
                  placeholder="Best Restaurants in Kuwait - Reviews & Ratings"
                  maxLength={120}
                />
                <small className={styles.helpText}>
                  Appears in search engine results. Aim for 50-60 characters.
                  {metaTitle.length > 70 && (
                    <span className={styles.warning}> Title may be truncated in search results.</span>
                  )}
                </small>
              </div>

              {/* Meta Description */}
              <div className="form-group">
                <label>
                  Meta Description
                  <span className={styles.characterCount}>
                    <span className={getCharacterCountClass(metaDescription.length, 160, 170)}>
                      {metaDescription.length}
                    </span>
                    /160 characters (optimal)
                  </span>
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => onChange('meta_description', e.target.value)}
                  placeholder="Discover top-rated restaurants in Kuwait with verified reviews, ratings, and contact information."
                  rows={3}
                  maxLength={320}
                />
                <small className={styles.helpText}>
                  Appears below the title in search results. Aim for 150-160 characters.
                  {metaDescription.length > 170 && (
                    <span className={styles.warning}> Description may be truncated.</span>
                  )}
                </small>
              </div>

              {/* Open Graph Fields (for businesses) */}
              {showOgFields && (
                <>
                  <div className={styles.divider}>
                    <span>Social Media (Open Graph) - English</span>
                  </div>

                  <div className="form-group">
                    <label>
                      OG Title (Social Media)
                      <span className={styles.characterCount}>
                        {ogTitle.length}/90 characters
                      </span>
                    </label>
                    <input
                      type="text"
                      value={ogTitle}
                      onChange={(e) => onChange('og_title', e.target.value)}
                      placeholder="Leave blank to use Meta Title"
                      maxLength={120}
                    />
                    <small className={styles.helpText}>
                      Used when sharing on Facebook, Twitter, etc. Falls back to Meta Title if empty.
                    </small>
                  </div>

                  <div className="form-group">
                    <label>
                      OG Description (Social Media)
                      <span className={styles.characterCount}>
                        {ogDescription.length}/200 characters
                      </span>
                    </label>
                    <textarea
                      value={ogDescription}
                      onChange={(e) => onChange('og_description', e.target.value)}
                      placeholder="Leave blank to use Meta Description"
                      rows={3}
                      maxLength={300}
                    />
                    <small className={styles.helpText}>
                      Description for social media previews. Falls back to Meta Description if empty.
                    </small>
                  </div>
                </>
              )}
            </>
          )}

          {/* Arabic Fields */}
          {activeLanguage === 'ar' && (
            <>
              <div className={styles.divider}>
                <span>Page Display (User-Visible) - Arabic</span>
              </div>

              {/* Page Title Arabic */}
              <div className="form-group">
                <label>
                  Page Title (User-Visible) - Arabic
                  <span className={styles.characterCount}>
                    {pageTitleAr.length} characters (no limit)
                  </span>
                </label>
                <input
                  type="text"
                  value={pageTitleAr}
                  onChange={(e) => onChange('page_title_ar', e.target.value)}
                  placeholder="أفضل المطاعم والمقاهي في الكويت - دليل شامل"
                  dir="rtl"
                />
                <small className={styles.helpText}>
                  عنوان الصفحة الرئيسي (H1) المعروض للمستخدمين. Falls back to English if empty.
                </small>
              </div>

              {/* Page Description Arabic */}
              <div className="form-group">
                <label>
                  Page Description (User-Visible) - Arabic
                  <span className={styles.characterCount}>
                    {pageDescriptionAr.length} characters (no limit)
                  </span>
                </label>
                <textarea
                  value={pageDescriptionAr}
                  onChange={(e) => onChange('page_description_ar', e.target.value)}
                  placeholder="استكشف أفضل المطاعم والمقاهي في الكويت مع تقييمات موثوقة وقوائم مفصلة ومعلومات الاتصال."
                  rows={3}
                  dir="rtl"
                />
                <small className={styles.helpText}>
                  الوصف المعروض للمستخدمين على الصفحة. Falls back to English if empty.
                </small>
              </div>

              <div className={styles.divider}>
                <span>Search Engine Metadata - Arabic</span>
              </div>

              {/* Meta Title Arabic */}
              <div className="form-group">
                <label>
                  Meta Title - Arabic
                  <span className={styles.characterCount}>
                    <span className={getCharacterCountClass(metaTitleAr.length, 60, 70)}>
                      {metaTitleAr.length}
                    </span>
                    /60 characters (optimal)
                  </span>
                </label>
                <input
                  type="text"
                  value={metaTitleAr}
                  onChange={(e) => onChange('meta_title_ar', e.target.value)}
                  placeholder="أفضل المطاعم في الكويت - التقييمات والآراء"
                  maxLength={120}
                  dir="rtl"
                />
                <small className={styles.helpText}>
                  يظهر في نتائج محركات البحث. استهدف 50-60 حرفًا.
                  {metaTitleAr.length > 70 && (
                    <span className={styles.warning}> قد يتم اقتطاع العنوان في نتائج البحث.</span>
                  )}
                </small>
              </div>

              {/* Meta Description Arabic */}
              <div className="form-group">
                <label>
                  Meta Description - Arabic
                  <span className={styles.characterCount}>
                    <span className={getCharacterCountClass(metaDescriptionAr.length, 160, 170)}>
                      {metaDescriptionAr.length}
                    </span>
                    /160 characters (optimal)
                  </span>
                </label>
                <textarea
                  value={metaDescriptionAr}
                  onChange={(e) => onChange('meta_description_ar', e.target.value)}
                  placeholder="اكتشف أفضل المطاعم في الكويت مع التقييمات والمراجعات ومعلومات الاتصال."
                  rows={3}
                  maxLength={320}
                  dir="rtl"
                />
                <small className={styles.helpText}>
                  يظهر أسفل العنوان في نتائج البحث. استهدف 150-160 حرفًا.
                  {metaDescriptionAr.length > 170 && (
                    <span className={styles.warning}> قد يتم اقتطاع الوصف.</span>
                  )}
                </small>
              </div>

              {/* Open Graph Fields (for businesses) */}
              {showOgFields && (
                <>
                  <div className={styles.divider}>
                    <span>Social Media (Open Graph) - Arabic</span>
                  </div>

                  <div className="form-group">
                    <label>
                      OG Title (Social Media) - Arabic
                      <span className={styles.characterCount}>
                        {ogTitleAr.length}/90 characters
                      </span>
                    </label>
                    <input
                      type="text"
                      value={ogTitleAr}
                      onChange={(e) => onChange('og_title_ar', e.target.value)}
                      placeholder="اترك فارغًا لاستخدام عنوان Meta"
                      maxLength={120}
                      dir="rtl"
                    />
                    <small className={styles.helpText}>
                      يُستخدم عند المشاركة على فيسبوك وتويتر، إلخ. Falls back to English if empty.
                    </small>
                  </div>

                  <div className="form-group">
                    <label>
                      OG Description (Social Media) - Arabic
                      <span className={styles.characterCount}>
                        {ogDescriptionAr.length}/200 characters
                      </span>
                    </label>
                    <textarea
                      value={ogDescriptionAr}
                      onChange={(e) => onChange('og_description_ar', e.target.value)}
                      placeholder="اترك فارغًا لاستخدام وصف Meta"
                      rows={3}
                      maxLength={300}
                      dir="rtl"
                    />
                    <small className={styles.helpText}>
                      وصف لمعاينات وسائل التواصل الاجتماعي. Falls back to English if empty.
                    </small>
                  </div>
                </>
              )}
            </>
          )}

          {/* OG Image (shared between languages) */}
          <div className={styles.divider}>
            <span>Social Media Image (Shared)</span>
          </div>

          <div className="form-group">
            <ImageUploader
              single={true}
              defaultImages={ogImage ? [ogImage] : []}
              onUploadComplete={(files) => {
                if (files.length > 0) {
                  onChange('og_image', files[0].url);
                }
              }}
              label="OG Image (Social Media)"
              helpText="Image shown when sharing on social media. Recommended: 1200x630px."
            />
            {ogImage && (
              <div style={{ marginTop: '10px' }}>
                <small className={styles.helpText}>
                  Current: <a href={ogImage} target="_blank" rel="noopener noreferrer">{ogImage}</a>
                  {' '}
                  <button
                    type="button"
                    onClick={() => onChange('og_image', '')}
                    style={{ marginLeft: '10px', fontSize: '12px' }}
                    className="btn btn-sm btn-secondary"
                  >
                    Remove
                  </button>
                </small>
              </div>
            )}
            {!showOgFields && (
              <small className={styles.helpText}>
                Falls back to category icon if not set.
              </small>
            )}
          </div>

          {/* SEO Preview */}
          <div className={styles.seoPreview}>
            <h4>Search Engine Preview ({activeLanguage === 'en' ? 'English' : 'Arabic'})</h4>
            <div className={styles.previewCard} dir={activeLanguage === 'ar' ? 'rtl' : 'ltr'}>
              <div className={styles.previewTitle}>
                {activeLanguage === 'en'
                  ? (metaTitle || 'Your Page Title Will Appear Here')
                  : (metaTitleAr || metaTitle || 'عنوان الصفحة سيظهر هنا')
                }
              </div>
              <div className={styles.previewUrl}>
                https://yourdomain.com/page-url
              </div>
              <div className={styles.previewDescription}>
                {activeLanguage === 'en'
                  ? (metaDescription || 'Your meta description will appear here. This is what users see in search results.')
                  : (metaDescriptionAr || metaDescription || 'سيظهر وصف Meta الخاص بك هنا. هذا ما يراه المستخدمون في نتائج البحث.')
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
