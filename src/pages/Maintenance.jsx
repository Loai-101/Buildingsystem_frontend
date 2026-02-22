import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { Card, CardHeader, CardTitle, CardBody } from '../components/Cards/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modals/Modal';
import { FormField } from '../components/FormField';
import { getTickets, createTicket, updateTicket, getVendors } from '../services/maintenanceService';
import { useAuthStore, isAdmin } from '../store/useAuthStore';
import { useTranslation } from '../i18n';
import { Plus, Phone, User } from 'lucide-react';
import './Maintenance.css';

const PRIORITIES = ['Low', 'Medium', 'High'];
const CATEGORIES = ['General', 'Plumbing', 'Electrical', 'HVAC', 'Security', 'Other'];
const STATUS_FLOW = ['Open', 'In Progress', 'Done'];

export function Maintenance() {
  const { t } = useTranslation();
  const isAdminRole = isAdmin();
  const [tickets, setTickets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  function load() {
    Promise.all([getTickets(), getVendors()]).then(([t, v]) => {
      setTickets(t);
      setVendors(v);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreateModal() {
    reset({ title: '', category: 'General', priority: 'Medium', description: '' });
    setModalOpen(true);
  }

  function onCreateTicket(data) {
    createTicket({
      title: data.title,
      category: data.category,
      priority: data.priority,
      description: data.description,
    })
      .then(() => {
        toast.success(t('maintenance.ticketCreated'));
        setModalOpen(false);
        load();
      })
      .catch(() => toast.error(t('maintenance.ticketCreated')));
  }

  function changeStatus(ticket, newStatus) {
    updateTicket(ticket.id, { status: newStatus })
      .then(() => {
        toast.success(t('maintenance.statusUpdated'));
        load();
      })
      .catch(() => toast.error(t('maintenance.statusUpdated')));
  }

  const statusLabel = (s) => (s === 'In Progress' ? t('maintenance.inProgress') : s === 'Done' ? t('maintenance.done') : t('maintenance.open'));
  const priorityLabel = (p) => (p === 'Low' ? t('maintenance.low') : p === 'High' ? t('maintenance.high') : t('maintenance.medium'));

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
      <Header title={t('maintenance.title')}>
        <Button onClick={openCreateModal}>
          <Plus size={18} />
          {t('maintenance.createTicket')}
        </Button>
      </Header>
      <div className="page-content">
        <p className="maintenance-intro">{t('maintenance.intro')}</p>

        <Card className="maintenance-tickets">
          <CardHeader>
            <CardTitle>{t('maintenance.tickets')}</CardTitle>
          </CardHeader>
          <CardBody>
            {tickets.length === 0 ? (
              <p className="empty-state">{t('maintenance.noTickets')}</p>
            ) : (
              <ul className="tickets-list">
                {tickets.map((ticket) => (
                  <li key={ticket.id} className="ticket-item">
                    <div className="ticket-main">
                      <span className="ticket-id">{ticket.id}</span>
                      <span className="ticket-title">{ticket.title}</span>
                      <span className="ticket-meta">
                        {ticket.category} · {priorityLabel(ticket.priority)} · {statusLabel(ticket.status)}
                      </span>
                      <span className="ticket-date">{ticket.createdDate}</span>
                    </div>
                    {isAdminRole && (
                      <div className="status-actions">
                        {STATUS_FLOW.map((s) =>
                          ticket.status !== s ? (
                            <Button key={s} variant="outline" className="btn--sm" onClick={() => changeStatus(ticket, s)}>
                              {statusLabel(s)}
                            </Button>
                          ) : null
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="maintenance-vendors">
          <CardHeader>
            <CardTitle>{t('maintenance.vendorsContacts')}</CardTitle>
          </CardHeader>
          <CardBody>
            {vendors.length === 0 ? (
              <p className="empty-state">{t('maintenance.noVendors')}</p>
            ) : (
              <div className="vendor-cards">
                {vendors.map((v) => (
                  <div key={v.id} className="vendor-card">
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
                      {v.title && <span className="vendor-card-title">{v.title}</span>}
                      <h3 className="vendor-card-name">{v.name}</h3>
                      {v.phone && (
                        <a href={`tel:${v.phone.replace(/\s/g, '')}`} className="vendor-card-phone">
                          <Phone size={16} aria-hidden="true" />
                          {v.phone}
                        </a>
                      )}
                      {v.category && <span className="vendor-card-category">{v.category}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('maintenance.createTicketModal')}>
        <form onSubmit={handleSubmit(onCreateTicket)} noValidate>
          <FormField label={t('maintenance.ticketTitle')} required error={errors.title?.message ? t('maintenance.titleRequired') : undefined}>
            <input
              type="text"
              placeholder={t('maintenance.titlePlaceholder')}
              {...register('title', { required: true })}
            />
          </FormField>
          <FormField label={t('accountsMonth.category')}>
            <select {...register('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t('maintenance.priority')}>
            <select {...register('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{priorityLabel(p)}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t('accountsMonth.description')} error={errors.description?.message}>
            <textarea {...register('description')} placeholder={t('maintenance.descriptionOptional')} />
          </FormField>
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.add')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
