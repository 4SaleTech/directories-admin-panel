import { useState, useEffect } from 'react';
import { toastService } from '@/application/services/toastService';
import { adminApiClient } from '@/infrastructure/api/adminApiClient';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import { FiSave, FiTrash2, FiClock } from 'react-icons/fi';
import styles from './WorkingHoursTab.module.scss';

interface WorkingHoursTabProps {
  businessId: number;
}

interface WorkingHour {
  id?: number;
  business_id?: number;
  day_name: string;
  open_time: string;
  close_time: string;
  is_closed?: boolean;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DAY_LABELS: Record<string, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

export default function WorkingHoursTab({ businessId }: WorkingHoursTabProps) {
  const [workingHours, setWorkingHours] = useState<Record<string, WorkingHour>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadWorkingHours();
  }, [businessId]);

  const loadWorkingHours = async () => {
    try {
      setIsLoading(true);
      const response = await adminApiClient.get(`/admin/businesses/${businessId}/working-hours`);

      // Convert array to object keyed by day_name
      const hoursMap: Record<string, WorkingHour> = {};

      // Initialize all days as closed
      DAYS.forEach(day => {
        hoursMap[day] = {
          day_name: day,
          open_time: '09:00',
          close_time: '17:00',
          is_closed: true,
        };
      });

      // Update with actual data
      if (response.data?.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((hour: any) => {
          hoursMap[hour.day_name] = {
            ...hour,
            is_closed: false,
          };
        });
      }

      setWorkingHours(hoursMap);
    } catch (err: any) {
      console.error('Failed to load working hours:', err);
      // Initialize with default closed days
      const defaultHours: Record<string, WorkingHour> = {};
      DAYS.forEach(day => {
        defaultHours[day] = {
          day_name: day,
          open_time: '09:00',
          close_time: '17:00',
          is_closed: true,
        };
      });
      setWorkingHours(defaultHours);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        is_closed: !prev[day].is_closed,
      },
    }));
  };

  const handleTimeChange = (day: string, field: 'open_time' | 'close_time', value: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Filter out closed days and prepare data
      const openDays = DAYS
        .filter(day => !workingHours[day].is_closed)
        .map(day => ({
          day: day,
          open_time: workingHours[day].open_time,
          close_time: workingHours[day].close_time,
        }));

      await adminApiClient.put(`/admin/businesses/${businessId}/working-hours`, {
        working_hours: openDays,
      });

      toastService.success('Working hours updated successfully!');
      loadWorkingHours();
    } catch (err: any) {
      toastService.error(`Failed to update working hours: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    toastService.confirm(
      'Are you sure you want to delete all working hours?',
      async () => {
        try {
          await adminApiClient.delete(`/admin/businesses/${businessId}/working-hours`);
          toastService.success('All working hours deleted successfully!');
          loadWorkingHours();
        } catch (err: any) {
          toastService.error(`Failed to delete working hours: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading working hours..." />;
  }

  return (
    <div className={styles.workingHours}>
      <div className={styles.header}>
        <div>
          <h2><FiClock /> Working Hours</h2>
          <p className={styles.subtitle}>Set the business operating hours for each day of the week</p>
        </div>
        <div className={styles.actions}>
          <button
            className="btn btn-danger"
            onClick={handleDeleteAll}
            disabled={isSaving}
          >
            <FiTrash2 /> Delete All
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <FiSave /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className={styles.daysList}>
        {DAYS.map((day) => (
          <div key={day} className={`${styles.dayRow} ${workingHours[day]?.is_closed ? styles.closed : ''}`}>
            <div className={styles.dayHeader}>
              <label className={styles.dayToggle}>
                <input
                  type="checkbox"
                  checked={!workingHours[day]?.is_closed}
                  onChange={() => handleDayToggle(day)}
                />
                <span className={styles.dayName}>{DAY_LABELS[day]}</span>
              </label>
              {workingHours[day]?.is_closed && (
                <span className="badge badge-secondary">Closed</span>
              )}
            </div>

            {!workingHours[day]?.is_closed && (
              <div className={styles.timeInputs}>
                <div className={styles.timeGroup}>
                  <label>Open Time</label>
                  <input
                    type="time"
                    value={workingHours[day]?.open_time || '09:00'}
                    onChange={(e) => handleTimeChange(day, 'open_time', e.target.value)}
                    className={styles.timeInput}
                  />
                </div>
                <span className={styles.timeSeparator}>to</span>
                <div className={styles.timeGroup}>
                  <label>Close Time</label>
                  <input
                    type="time"
                    value={workingHours[day]?.close_time || '17:00'}
                    onChange={(e) => handleTimeChange(day, 'close_time', e.target.value)}
                    className={styles.timeInput}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.help}>
        <h4>Tips:</h4>
        <ul>
          <li>Check a day to mark it as open and set hours</li>
          <li>Uncheck a day to mark it as closed</li>
          <li>Times are in 24-hour format (HH:MM)</li>
          <li>Click "Save Changes" to apply all modifications</li>
        </ul>
      </div>
    </div>
  );
}
