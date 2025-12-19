import { Business } from '@/domain/entities/Business';
import { FiMail, FiGlobe, FiPhone, FiMapPin, FiStar, FiCheck, FiX } from 'react-icons/fi';
import styles from './OverviewTab.module.scss';

interface OverviewTabProps {
  business: Business;
  onUpdate: () => void;
}

export default function OverviewTab({ business }: OverviewTabProps) {
  return (
    <div className={styles.overview}>
      <h2>Business Information</h2>

      <div className={styles.section}>
        <h3>Basic Details</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label>Business ID:</label>
            <span>{business.id}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Slug:</label>
            <span>{business.slug}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Status:</label>
            <span className={`badge ${business.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
              {business.status}
            </span>
          </div>
          <div className={styles.infoItem}>
            <label>Category ID:</label>
            <span>{business.category_id}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Verified:</label>
            <span>
              {business.is_verified ? (
                <span className="badge badge-success"><FiCheck /> Yes</span>
              ) : (
                <span className="badge badge-secondary"><FiX /> No</span>
              )}
            </span>
          </div>
          <div className={styles.infoItem}>
            <label>Featured:</label>
            <span>
              {business.is_featured ? (
                <span className="badge badge-warning"><FiStar /> Yes</span>
              ) : (
                <span className="badge badge-secondary"><FiX /> No</span>
              )}
            </span>
          </div>
          <div className={styles.infoItem}>
            <label>Rating:</label>
            <span>{business.rating ? business.rating.toFixed(1) : 'N/A'}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Total Reviews:</label>
            <span>{business.total_reviews || 0}</span>
          </div>
        </div>
      </div>

      {business.about && (
        <div className={styles.section}>
          <h3>About</h3>
          <div className={styles.richText} dangerouslySetInnerHTML={{ __html: business.about }} />
        </div>
      )}

      {business.about_ar && (
        <div className={styles.section}>
          <h3>About (Arabic)</h3>
          <div className={styles.richText} dir="rtl" dangerouslySetInnerHTML={{ __html: business.about_ar }} />
        </div>
      )}

      <div className={styles.section}>
        <h3>Contact Information</h3>
        <div className={styles.contactInfo}>
          {business.contact_info?.email && (
            <div className={styles.contactItem}>
              <FiMail />
              <a href={`mailto:${business.contact_info.email}`}>{business.contact_info.email}</a>
            </div>
          )}
          {business.contact_info?.website && (
            <div className={styles.contactItem}>
              <FiGlobe />
              <a href={business.contact_info.website} target="_blank" rel="noopener noreferrer">
                {business.contact_info.website}
              </a>
            </div>
          )}
          {business.contact_info?.contact_numbers && business.contact_info.contact_numbers.length > 0 && (
            <div className={styles.contactItem}>
              <FiPhone />
              <span>{business.contact_info.contact_numbers.join(', ')}</span>
            </div>
          )}
          {business.contact_info?.whatsapp && business.contact_info.whatsapp.length > 0 && (
            <div className={styles.contactItem}>
              <FiPhone />
              <span>WhatsApp: {business.contact_info.whatsapp.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {(business.address || business.address_ar) && (
        <div className={styles.section}>
          <h3>Address</h3>
          <div className={styles.addressInfo}>
            {business.address && (
              <div className={styles.addressItem}>
                <FiMapPin />
                <span>{business.address}</span>
              </div>
            )}
            {business.address_ar && (
              <div className={styles.addressItem} dir="rtl">
                <FiMapPin />
                <span>{business.address_ar}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {business.tags && business.tags.length > 0 && (
        <div className={styles.section}>
          <h3>Tags</h3>
          <div className={styles.tags}>
            {business.tags.map((tag) => (
              <span key={tag.id} className="badge badge-info">
                {tag.name} {tag.name_ar && `(${tag.name_ar})`}
              </span>
            ))}
          </div>
        </div>
      )}

      {business.attributes && Object.keys(business.attributes).length > 0 && (
        <div className={styles.section}>
          <h3>Attributes</h3>
          <div className={styles.attributes}>
            {Object.entries(business.attributes).map(([key, value]) => (
              <div key={key} className={styles.attributeItem}>
                <label>{key}:</label>
                <span>
                  {typeof value === 'object' && value !== null
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
