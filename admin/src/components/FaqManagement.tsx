import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { faqAPI } from '../services/api';
import styles from './FaqManagement.module.css';
import pageStyles from '../styles/Pages.module.css';
import classNames from 'classnames';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import NotificationModal from './NotificationModal';
import type { NotificationType } from './NotificationModal';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  targetAudience: 'guest' | 'host' | 'both';
}

const FaqManagement = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ question: '', answer: '', targetAudience: 'both' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; faqId: string }>({
    isOpen: false,
    faqId: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ isOpen: boolean; type: NotificationType; title: string; message: string }>({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const response = await faqAPI.getAll();
      setFaqs(response.data);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    }
  };

  const handleSelectFaq = (faq: FAQ) => {
    setSelectedFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer, targetAudience: faq.targetAudience });
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setSelectedFaq(null);
    setFormData({ question: '', answer: '', targetAudience: 'both' });
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setIsEditing(false);
    if (isCreating) {
      setSelectedFaq(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, faqId: id });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await faqAPI.delete(deleteModal.faqId);
      if (selectedFaq?.id === deleteModal.faqId) {
        setSelectedFaq(null);
      }
      fetchFaqs();
      setDeleteModal({ isOpen: false, faqId: '' });
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        message: "Please fill in all required fields (Question and Answer)."
      });
      return;
    }
    try {
      if (isCreating) {
        await faqAPI.create(formData);
      } else if (selectedFaq) {
        await faqAPI.update(selectedFaq.id, formData);
      }
      fetchFaqs();
      cancelEdit();
    } catch (err) {
      console.error('Failed to save FAQ:', err);
    }
  };

  return (
    <div className={styles.faqContainer}>
      <div className={styles.headerRow}>
        <div />
        <button className={styles.addBtn} onClick={handleCreateNew}>
          <Plus size={18} /> Add New FAQ
        </button>
      </div>

      <div className={styles.contentLayout}>
        {/* Left-side List */}
        <div className={styles.faqList}>
          {faqs.map(faq => (
            <div 
              key={faq.id} 
              className={classNames(styles.faqItem, { [styles.activeItem]: selectedFaq?.id === faq.id })}
              onClick={() => handleSelectFaq(faq)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.faqQuestion}>{faq.question}</div>
              <div className={styles.actionGroup}>
                <button 
                  className={styles.deleteBtn} 
                  onClick={(e) => handleDeleteClick(e, faq.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={16} color="var(--text-light)" />
              </div>
            </div>
          ))}
          {faqs.length === 0 && <p className={styles.emptyText}>No FAQs found. Click "Add New FAQ" to get started.</p>}
        </div>

        {/* Right-side Editor */}
        <div className={styles.editorPanel}>
          {(selectedFaq || isCreating) ? (
            <div className={styles.editorContent}>
               <div className={styles.editorHeader}>
                <h3>{isCreating ? 'Create New FAQ' : (isEditing ? 'Update FAQ' : 'FAQ Details')}</h3>
                <button className={styles.cancelBtn} onClick={cancelEdit}>
                  <X size={18} />
                </button>
              </div>

              {(isCreating || isEditing) ? (
                <form onSubmit={handleSave} className={styles.faqForm}>
                  <div className={pageStyles.formGroup}>
                    <label>Question</label>
                    <input 
                      type="text" 
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Enter the question here"
                      required
                    />
                  </div>

                  <div className={pageStyles.formGroup}>
                    <label>Target Audience</label>
                    <select 
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    >
                      <option value="both">Both (Host & Guest)</option>
                      <option value="guest">Guest</option>
                      <option value="host">Host</option>
                    </select>
                  </div>

                  <div className={classNames(pageStyles.formGroup, styles.expanded)}>
                    <label>Answer</label>
                    <textarea 
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="Enter the detailed answer here..."
                      required
                      style={{ flex: 1, minHeight: '200px' }}
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={classNames(pageStyles.btn, pageStyles.primary, styles.fullWidth)}>
                      {isCreating ? 'Create FAQ' : 'Update FAQ'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.viewMode}>
                  <div className={styles.viewField}>
                    <label>Question</label>
                    <p>{selectedFaq?.question}</p>
                  </div>
                  <div className={styles.viewField}>
                    <label>Target Audience</label>
                    <p style={{ textTransform: 'capitalize' }}>{selectedFaq?.targetAudience === 'both' ? 'Both (Host & Guest)' : selectedFaq?.targetAudience}</p>
                  </div>
                  <div className={styles.viewField}>
                    <label>Answer</label>
                    <div className={styles.answerBox}>
                      {selectedFaq?.answer}
                    </div>
                  </div>
                  <div className={styles.formActions} style={{ marginTop: '24px' }}>
                    <button 
                      className={classNames(pageStyles.btn, pageStyles.primary, styles.fullWidth)}
                      onClick={() => setIsEditing(true)}
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.placeholderState}>
              <div className={styles.placeholderIcon}>?</div>
              <p>Select an FAQ from the list to view or edit its details.</p>
            </div>
          )}
        </div>
      </div>

      {deleteModal.isOpen && (
        <DeleteConfirmationModal
          title="Delete FAQ"
          message="Are you sure you want to remove this FAQ? This action cannot be undone and will remove it from the mobile app as well."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, faqId: '' })}
          isDeleting={isDeleting}
        />
      )}

      {notification.isOpen && (
        <NotificationModal 
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification({ ...notification, isOpen: false })}
        />
      )}
    </div>
  );
};

export default FaqManagement;
