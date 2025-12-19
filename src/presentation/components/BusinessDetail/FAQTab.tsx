import { useState, useEffect } from 'react';
import { toastService } from '@/application/services/toastService';
import { adminApiClient } from '@/infrastructure/api/adminApiClient';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import { FiHelpCircle, FiPlus, FiEdit2, FiTrash2, FiSave, FiEyeOff, FiEye } from 'react-icons/fi';
import styles from './FAQTab.module.scss';

interface FAQTabProps {
  businessId: number;
}

interface FAQ {
  id: number;
  business_id: number;
  question: string;
  question_ar?: string;
  answer: string;
  answer_ar?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function FAQTab({ businessId }: FAQTabProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    question_ar: '',
    answer: '',
    answer_ar: '',
    display_order: '',
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFAQs();
  }, [businessId]);

  const loadFAQs = async () => {
    try {
      setIsLoading(true);
      const response = await adminApiClient.get(`/admin/businesses/${businessId}/faqs`);
      setFaqs(response.faqs || []);
    } catch (err: any) {
      console.error('Failed to load FAQs:', err);
      if (err.response?.status !== 404) {
        toastService.error('Failed to load FAQs');
      }
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFAQ(null);
    setFormData({
      question: '',
      question_ar: '',
      answer: '',
      answer_ar: '',
      display_order: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question || '',
      question_ar: faq.question_ar || '',
      answer: faq.answer || '',
      answer_ar: faq.answer_ar || '',
      display_order: faq.display_order?.toString() || '',
      is_active: faq.is_active !== undefined ? faq.is_active : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question || !formData.answer) {
      toastService.error('Question and answer are required');
      return;
    }

    try {
      setIsSaving(true);

      const payload: any = {
        question: formData.question,
        answer: formData.answer,
        is_active: formData.is_active,
      };

      // Add optional fields only if they have values
      if (formData.question_ar) payload.question_ar = formData.question_ar;
      if (formData.answer_ar) payload.answer_ar = formData.answer_ar;
      if (formData.display_order) payload.display_order = parseInt(formData.display_order);

      if (editingFAQ) {
        // Update existing FAQ
        await adminApiClient.put(`/admin/faqs/${editingFAQ.id}`, payload);
        toastService.success('FAQ updated successfully!');
      } else {
        // Create new FAQ
        await adminApiClient.post(`/admin/businesses/${businessId}/faqs`, payload);
        toastService.success('FAQ created successfully!');
      }

      setShowModal(false);
      loadFAQs();
    } catch (err: any) {
      toastService.error(`Failed to save FAQ: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (faq: FAQ) => {
    toastService.confirm(
      `Are you sure you want to delete this FAQ?`,
      async () => {
        try {
          await adminApiClient.delete(`/admin/faqs/${faq.id}`);
          toastService.success('FAQ deleted successfully!');
          loadFAQs();
        } catch (err: any) {
          toastService.error(`Failed to delete FAQ: ${err.response?.data?.error || err.message}`);
        }
      }
    );
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      await adminApiClient.put(`/admin/faqs/${faq.id}`, {
        is_active: !faq.is_active,
      });
      toastService.success(`FAQ ${!faq.is_active ? 'activated' : 'deactivated'} successfully!`);
      loadFAQs();
    } catch (err: any) {
      toastService.error(`Failed to update FAQ: ${err.response?.data?.error || err.message}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading FAQs..." />;
  }

  return (
    <div className={styles.faqTab}>
      <div className={styles.header}>
        <div>
          <h2><FiHelpCircle /> FAQs</h2>
          <p className={styles.subtitle}>Manage frequently asked questions</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>
          <FiPlus /> Add FAQ
        </button>
      </div>

      {faqs.length === 0 ? (
        <div className={styles.empty}>
          <FiHelpCircle size={48} />
          <p>No FAQs yet</p>
          <button className="btn btn-primary" onClick={handleCreate}>
            <FiPlus /> Add First FAQ
          </button>
        </div>
      ) : (
        <div className={styles.faqList}>
          {faqs
            .sort((a, b) => a.display_order - b.display_order)
            .map((faq) => (
              <div key={faq.id} className={`${styles.faqCard} ${!faq.is_active ? styles.inactive : ''}`}>
                <div className={styles.faqHeader}>
                  <div className={styles.faqTitle}>
                    <div className={styles.questionSection}>
                      <h3>{faq.question}</h3>
                      {faq.question_ar && <p className={styles.questionAr}>{faq.question_ar}</p>}
                    </div>
                    <div className={styles.badges}>
                      <span className={`badge ${faq.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {faq.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="badge badge-info">Order: {faq.display_order}</span>
                    </div>
                  </div>
                  <div className={styles.faqActions}>
                    <button
                      className={`btn btn-${faq.is_active ? 'secondary' : 'success'} btn-sm`}
                      onClick={() => handleToggleActive(faq)}
                      title={faq.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {faq.is_active ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleEdit(faq)}
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(faq)}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>

                <div className={styles.faqContent}>
                  <div className={styles.answerSection}>
                    <strong>Answer:</strong>
                    <p>{faq.answer}</p>
                  </div>
                  {faq.answer_ar && (
                    <div className={styles.answerSection}>
                      <strong>الإجابة:</strong>
                      <p className={styles.answerAr} dir="rtl">{faq.answer_ar}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>{editingFAQ ? 'Edit FAQ' : 'Add FAQ'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Question *</label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter the question"
                  rows={2}
                  required
                />
              </div>

              <div className="form-group">
                <label>Question (Arabic)</label>
                <textarea
                  value={formData.question_ar}
                  onChange={(e) => setFormData({ ...formData, question_ar: e.target.value })}
                  placeholder="أدخل السؤال"
                  rows={2}
                  dir="rtl"
                />
              </div>

              <div className="form-group">
                <label>Answer *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Enter the answer"
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label>Answer (Arabic)</label>
                <textarea
                  value={formData.answer_ar}
                  onChange={(e) => setFormData({ ...formData, answer_ar: e.target.value })}
                  placeholder="أدخل الإجابة"
                  rows={4}
                  dir="rtl"
                />
              </div>

              <div className={styles.formRow}>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <FiSave /> {isSaving ? 'Saving...' : editingFAQ ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
