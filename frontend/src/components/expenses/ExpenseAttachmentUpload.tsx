import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, Download, Trash2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { QuotaErrorModal } from '../QuotaErrorModal';
import { useQuotaError } from '../../hooks/useQuotaError';

export interface ExpenseAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
  uploader?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

interface ExpenseAttachmentUploadProps {
  expenseId: string;
  attachments?: ExpenseAttachment[];
  onAttachmentsChange?: (attachments: ExpenseAttachment[]) => void;
  readonly?: boolean;
}

export default function ExpenseAttachmentUpload({
  expenseId,
  attachments: initialAttachments = [],
  onAttachmentsChange,
  readonly = false,
}: ExpenseAttachmentUploadProps) {
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quotaErrorHandler = useQuotaError();

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !expenseId) return;

      // Validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Le fichier est trop volumineux (max 10MB)');
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.includes(file.type)) {
        alert('Type de fichier non autorisé');
        return;
      }

      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/expenses/${expenseId}/attachments`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          const newAttachment = response.data.data;
          const updatedAttachments = [...attachments, newAttachment];
          setAttachments(updatedAttachments);
          onAttachmentsChange?.(updatedAttachments);
        }
      } catch (error: any) {
        console.error('Error uploading file:', error);
        if (error.response?.status === 403 && error.response?.data?.code === 'QUOTA_EXCEEDED') {
          // Utiliser le hook pour gérer l'erreur de quota avec modal
          quotaErrorHandler.handleError(error);
        } else {
          alert(error.response?.data?.message || 'Erreur lors de l\'upload du fichier');
        }
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [expenseId, attachments, onAttachmentsChange]
  );

  const handleDelete = useCallback(
    async (attachmentId: string) => {
      if (!confirm('Voulez-vous vraiment supprimer ce justificatif ?')) return;

      try {
        await api.delete(`/expenses/${expenseId}/attachments/${attachmentId}`);

        const updatedAttachments = attachments.filter((a) => a.id !== attachmentId);
        setAttachments(updatedAttachments);
        onAttachmentsChange?.(updatedAttachments);
      } catch (error: any) {
        console.error('Error deleting file:', error);
        alert(error.response?.data?.message || 'Erreur lors de la suppression du fichier');
      }
    },
    [expenseId, attachments, onAttachmentsChange]
  );

  const handlePreview = useCallback((attachment: ExpenseAttachment) => {
    const isImage = attachment.mimetype.startsWith('image/');
    const url = `/api/v1/expenses/${expenseId}/attachments/${attachment.filename}`;

    if (isImage) {
      setPreview({ url, type: 'image', name: attachment.originalName });
    } else if (attachment.mimetype === 'application/pdf') {
      setPreview({ url, type: 'pdf', name: attachment.originalName });
    } else {
      // Pour les autres types, ouvrir dans un nouvel onglet
      window.open(url, '_blank');
    }
  }, [expenseId]);

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return Image;
    if (mimetype === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      {!readonly && (
        <div
          className="border-2 border-dashed border-border/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm text-text-secondary">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-text-muted" />
              <p className="text-sm font-medium text-text-primary">
                Cliquez pour ajouter un justificatif
              </p>
              <p className="text-xs text-text-secondary">
                PDF, Images, Word, Excel (max 10MB)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Liste des justificatifs */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-text-primary">
            Justificatifs ({attachments.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attachments.map((attachment) => {
              const Icon = getFileIcon(attachment.mimetype);
              return (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border/30 hover:shadow-sm transition-shadow"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {attachment.originalName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatFileSize(attachment.size)} •{' '}
                      {new Date(attachment.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreview(attachment)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Prévisualiser"
                    >
                      <Download size={16} className="text-text-muted" />
                    </button>
                    {!readonly && (
                      <button
                        onClick={() => handleDelete(attachment.id)}
                        className="p-1.5 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de prévisualisation */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-border/30 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">{preview.name}</h3>
              <button
                onClick={() => setPreview(null)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>
            <div className="p-4">
              {preview.type === 'image' ? (
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : preview.type === 'pdf' ? (
                <iframe
                  src={preview.url}
                  className="w-full h-[80vh] border-0"
                  title={preview.name}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
      <QuotaErrorModal
        isOpen={quotaErrorHandler.showModal}
        onClose={quotaErrorHandler.closeModal}
        error={quotaErrorHandler.quotaError}
      />
    </div>
  );
}

