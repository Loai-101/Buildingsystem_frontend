import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { Card, CardHeader, CardTitle, CardBody } from '../components/Cards/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modals/Modal';
import { ConfirmDialog } from '../components/Modals/ConfirmDialog';
import { FormField } from '../components/FormField';
import { getVendors, addVendor, updateVendor, deleteVendor } from '../services/maintenanceService';
import { isAdmin } from '../store/useAuthStore';
import { useTranslation } from '../i18n';
import { Plus, Phone, User, Trash2, Camera } from 'lucide-react';
import './Maintenance.css';

const VENDOR_CATEGORIES = ['General', 'Plumbing', 'Electrical', 'HVAC', 'Security', 'Cleaner', 'Other'];

export function Maintenance() {
  const { t } = useTranslation();
  const isAdminRole = isAdmin();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [viewingVendor, setViewingVendor] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', variant: 'danger', confirmLabel: '', onConfirm: null });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  function load() {
    getVendors().then(setVendors).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openAddVendorModal() {
    setEditingVendor(null);
    setEditImage(null);
    reset({ name: '', title: '', phone: '', category: 'General' });
    setVendorModalOpen(true);
  }

  function openEditVendorModal(v) {
    setEditingVendor(v);
    setEditImage(v.image || null);
    reset({
      name: v.name || '',
      title: v.title || '',
      phone: v.phone || '',
      category: v.category || 'General',
    });
    setVendorModalOpen(true);
  }

  function closeVendorModal() {
    setVendorModalOpen(false);
    setEditingVendor(null);
    setEditImage(null);
  }

  function openViewVendorModal(v) {
    setViewingVendor(v);
  }

  function closeViewVendorModal() {
    setViewingVendor(null);
  }

  function handleVendorImageChange(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setEditImage(reader.result);
    reader.readAsDataURL(file);
  }

  function onAddVendor(data) {
    addVendor({
      name: data.name,
      title: data.title || '',
      phone: data.phone || '',
      category: data.category || 'General',
      image: editImage || null,
    })
      .then(() => {
        toast.success(t('maintenance.vendorAdded'));
        closeVendorModal();
        load();
      })
      .catch(() => toast.error(t('maintenance.vendorAddFailed')));
  }

  function onUpdateVendor(data) {
    if (!editingVendor) return;
    updateVendor(editingVendor.id, {
      name: data.name,
      title: data.title || '',
      phone: data.phone || '',
      category: data.category || 'General',
      image: editImage,
    })
      .then(() => {
        toast.success(t('maintenance.vendorUpdated'));
        closeVendorModal();
        load();
      })
      .catch(() => toast.error(t('maintenance.vendorUpdateFailed')));
  }

  function onDeleteVendor(v, e) {
    if (e) e.stopPropagation();
    setConfirm({
      open: true,
      title: t('maintenance.deleteVendor'),
      message: t('maintenance.deleteVendorConfirm', { name: v.name }),
      variant: 'danger',
      confirmLabel: t('common.delete'),
      onConfirm: () => {
        deleteVendor(v.id)
          .then(() => {
            toast.success(t('maintenance.vendorDeleted'));
            load();
          })
          .catch(() => toast.error(t('maintenance.vendorDeleteFailed')))
          .finally(() => setConfirm((c) => ({ ...c, open: false })));
      },
    });
  }

  if (loading) {
    return (
      <div className="maintenance-page">
        <Header title={t('maintenance.title')} />
        <div className="page-content"><p className="loading-state">{t('common.loading')}</p></div>
      </div>
    );
  }

  return (
    <div className="maintenance-page">
      <Header title={t('maintenance.title')} />
      <div className="page-content">
        <p className="maintenance-intro">{t('maintenance.intro')}</p>

        <Card className="maintenance-vendors">
          <CardHeader>
            <CardTitle>{t('maintenance.vendorsContacts')}</CardTitle>
            {isAdminRole && (
              <Button onClick={openAddVendorModal}>
                <Plus size={18} />
                {t('maintenance.addVendor')}
              </Button>
            )}
          </CardHeader>
          <CardBody>
            {vendors.length === 0 ? (
              <p className="empty-state">{t('maintenance.noVendors')}</p>
            ) : (
              <div className="vendor-cards">
                {vendors.map((v) => (
                  <div
                    key={v.id}
                    className={`vendor-card ${isAdminRole ? 'vendor-card--editable' : 'vendor-card--viewable'}`}
                    role="button"
                    tabIndex={0}
                    onClick={isAdminRole ? () => openEditVendorModal(v) : () => openViewVendorModal(v)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isAdminRole ? openEditVendorModal(v) : openViewVendorModal(v); } }}
                  >
                    <div className="vendor-card-image-wrap">
                      {v.image ? (
                        <img src={v.image} alt="" className="vendor-card-image" />
                      ) : (
                        <div className="vendor-card-placeholder" aria-hidden="true">
                          <User size={32} />
                        </div>
                      )}
                    </div>
                    <div className="vendor-card-content">
                      {isAdminRole && (
                        <Button
                          type="button"
                          variant="outline"
                          className="vendor-card-delete"
                          onClick={(e) => onDeleteVendor(v, e)}
                          title={t('maintenance.deleteVendor')}
                          aria-label={t('maintenance.deleteVendor')}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                      {v.title && <span className="vendor-card-title">{v.title}</span>}
                      <h3 className="vendor-card-name">{v.name}</h3>
                      {v.phone && (
                        <a href={`tel:${v.phone.replace(/\s/g, '')}`} className="vendor-card-phone" onClick={(e) => e.stopPropagation()}>
                          <Phone size={16} aria-hidden="true" />
                          {v.phone}
                        </a>
                      )}
                      {v.category && <span className="vendor-card-category">{VENDOR_CATEGORIES.includes(v.category) ? t(`maintenance.categories.${v.category}`) : v.category}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal open={vendorModalOpen} onClose={closeVendorModal} title={editingVendor ? t('maintenance.editVendorModal') : t('maintenance.addVendorModal')}>
        <form onSubmit={handleSubmit(editingVendor ? onUpdateVendor : onAddVendor)} noValidate>
          <div className="vendor-form-image-row">
            <div className="vendor-form-image-preview">
              {editImage ? (
                <img src={editImage} alt="" />
              ) : (
                <div className="vendor-form-image-placeholder" aria-hidden="true">
                  <User size={40} />
                </div>
              )}
            </div>
            <div className="vendor-form-image-actions">
              <label className="vendor-form-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleVendorImageChange}
                  className="visually-hidden"
                />
                <Camera size={18} aria-hidden="true" />
                {t('maintenance.uploadImage')}
              </label>
              {editImage && (
                <Button type="button" variant="outline" className="vendor-form-remove-image" onClick={() => setEditImage(null)}>
                  {t('maintenance.removeImage')}
                </Button>
              )}
            </div>
          </div>
          <FormField label={t('maintenance.vendorName')} required error={errors.name?.message ? t('maintenance.vendorNameRequired') : undefined}>
            <input
              type="text"
              placeholder={t('maintenance.vendorNamePlaceholder')}
              {...register('name', { required: true })}
            />
          </FormField>
          <FormField label={t('maintenance.vendorTitle')}>
            <input type="text" placeholder={t('maintenance.vendorTitlePlaceholder')} {...register('title')} />
          </FormField>
          <FormField label={t('maintenance.vendorPhone')}>
            <input type="text" placeholder={t('maintenance.vendorPhonePlaceholder')} {...register('phone')} />
          </FormField>
          <FormField label={t('accountsMonth.category')}>
            <select {...register('category')}>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`maintenance.categories.${c}`)}</option>
              ))}
            </select>
          </FormField>
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={closeVendorModal}>{t('common.cancel')}</Button>
            <Button type="submit">{editingVendor ? t('common.save') : t('common.add')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={confirm.confirmLabel}
        cancelLabel={t('common.cancel')}
      />

      {viewingVendor && (
        <Modal open={!!viewingVendor} onClose={closeViewVendorModal} title={t('maintenance.vendorProfile')}>
          <div className="vendor-view-profile">
            <div className="vendor-view-image-wrap">
              {viewingVendor.image ? (
                <img src={viewingVendor.image} alt="" className="vendor-view-image" />
              ) : (
                <div className="vendor-view-placeholder" aria-hidden="true">
                  <User size={48} />
                </div>
              )}
            </div>
            {viewingVendor.title && <span className="vendor-view-title">{viewingVendor.title}</span>}
            <h3 className="vendor-view-name">{viewingVendor.name}</h3>
            {viewingVendor.category && (
              <span className="vendor-view-category">
                {VENDOR_CATEGORIES.includes(viewingVendor.category) ? t(`maintenance.categories.${viewingVendor.category}`) : viewingVendor.category}
              </span>
            )}
            {viewingVendor.phone ? (
              <a href={`tel:${viewingVendor.phone.replace(/\s/g, '')}`} className="vendor-view-call">
                <Phone size={20} aria-hidden="true" />
                {t('maintenance.callNumber')} {viewingVendor.phone}
              </a>
            ) : (
              <p className="vendor-view-no-phone">{t('maintenance.noPhone')}</p>
            )}
            <div className="modal-actions">
              <Button type="button" variant="outline" onClick={closeViewVendorModal}>{t('common.close')}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
