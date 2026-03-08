import { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Header } from '../components/Header';
import { Card, CardHeader, CardTitle, CardBody } from '../components/Cards/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modals/Modal';
import { ConfirmDialog } from '../components/Modals/ConfirmDialog';
import { FormField } from '../components/FormField';
import { getBookings, createBooking, updateBookingStatus, updateBooking, getApprovedDates } from '../services/bookingService';
import { useAuthStore, isAdmin } from '../store/useAuthStore';
import { useTranslation } from '../i18n';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import './MajlisBooking.css';

/* Using FullCalendar: industry-standard, good docs, dayGrid + interaction for date click and event display. */

const STATUS_COLORS = {
  Pending: '#fd7e14',
  Approved: '#198754',
  Rejected: '#dc3545',
};

export function MajlisBooking() {
  const { t } = useTranslation();
  const isAdminRole = isAdmin();
  const loginUser = useAuthStore((s) => s.user);
  const [bookings, setBookings] = useState([]);
  const [approvedDates, setApprovedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewBooking, setViewBooking] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', variant: 'primary', confirmLabel: '', onConfirm: null });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  function load() {
    Promise.all([getBookings(), getApprovedDates()]).then(([b, dates]) => {
      setBookings(b);
      setApprovedDates(dates);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const events = bookings.map((b) => {
    const timeStr = (b.startTime || b.endTime) ? ` ${[b.startTime, b.endTime].filter(Boolean).join('–')}` : '';
    return {
      id: b.id,
      title: b.name + timeStr + (b.status !== 'Approved' ? ` (${b.status})` : ''),
      start: b.date,
      allDay: true,
      editable: true,
      backgroundColor: STATUS_COLORS[b.status] || '#6c757d',
      borderColor: STATUS_COLORS[b.status] || '#6c757d',
    };
  });

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const openBookingModal = useCallback((dateStr) => {
    if (dateStr < todayStr()) {
      toast.error(t('majlisBooking.pastDateBlocked'));
      return;
    }
    if (approvedDates.includes(dateStr)) {
      toast.error(t('majlisBooking.dateBlocked'));
      return;
    }
    setSelectedDate(dateStr);
    const defaultName = (typeof loginUser === 'string' ? loginUser : (loginUser && loginUser.username) || '') || '';
    reset({ date: dateStr, startTime: '09:00', endTime: '10:00', name: defaultName, notes: '' });
    setModalOpen(true);
  }, [approvedDates, reset, t, loginUser]);

  const openBookingModalRef = useRef(openBookingModal);
  openBookingModalRef.current = openBookingModal;

  function handleDateClick(info) {
    openBookingModal(info.dateStr);
  }

  function handleEventClick(info) {
    const id = info.event.id;
    const booking = bookings.find((b) => b.id === id);
    if (booking) setViewBooking(booking);
  }

  function dayCellDidMount(arg) {
    const dateStr = arg.date.toISOString().slice(0, 10);
    const top = arg.el.querySelector('.fc-daygrid-day-top');
    if (!top) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fc-day-add-btn';
    btn.innerHTML = '+';
    btn.setAttribute('aria-label', t('majlisBooking.requestBooking'));
    btn.setAttribute('data-date', dateStr);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openBookingModalRef.current(dateStr);
    });
    top.appendChild(btn);
  }

  function onSubmitRequest(data) {
    const dateToSubmit = selectedDate || data.date;
    createBooking({
      date: dateToSubmit,
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      name: data.name,
      notes: data.notes,
    })
      .then(() => {
        toast.success(t('majlisBooking.requestSubmitted'));
        setModalOpen(false);
        setSelectedDate(null);
        load();
      })
      .catch((err) => {
        const msg = err.message || '';
        if (msg.includes('Past dates')) toast.error(t('majlisBooking.pastDateBlocked'));
        else if (msg.includes('fully booked') || msg.includes('already approved')) toast.error(t('majlisBooking.dateApprovedFullyBooked'));
        else if (msg.includes('3 hours')) toast.error(t('majlisBooking.sameDayConflict'));
        else toast.error(msg || t('common.noData'));
      });
  }

  function approveReject(id, status) {
    const isApprove = status === 'Approved';
    setConfirm({
      open: true,
      title: isApprove ? t('majlisBooking.approve') : t('majlisBooking.reject'),
      message: isApprove ? t('majlisBooking.approveConfirm') : t('majlisBooking.rejectConfirm'),
      variant: isApprove ? 'success' : 'danger',
      confirmLabel: isApprove ? t('majlisBooking.approve') : t('majlisBooking.reject'),
      onConfirm: () => {
        updateBookingStatus(id, status)
          .then(() => {
            toast.success(status === 'Approved' ? t('majlisBooking.bookingApproved') : t('majlisBooking.bookingRejected'));
            load();
          })
          .catch(() => toast.error(t('common.noData')))
          .finally(() => setConfirm((c) => ({ ...c, open: false })));
      },
    });
  }

  function handleEventDrop(info) {
    if (!isAdminRole) {
      info.revert();
      return;
    }
    const start = info.event.start;
    if (!start) {
      info.revert();
      return;
    }
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, '0');
    const d = String(start.getDate()).padStart(2, '0');
    const newDateStr = `${y}-${m}-${d}`;
    const today = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    if (newDateStr < today) {
      toast.error(t('majlisBooking.pastDateBlocked'));
      info.revert();
      return;
    }
    if (approvedDates.includes(newDateStr)) {
      toast.error(t('majlisBooking.dateBlocked'));
      info.revert();
      return;
    }
    const bookingId = info.event.id;
    updateBooking(bookingId, { date: newDateStr, status: 'Pending' })
      .then(() => {
        toast.success(t('majlisBooking.bookingDateMoved'));
        load();
      })
      .catch((err) => {
        const msg = err.message || '';
        if (msg.includes('Past dates')) toast.error(t('majlisBooking.pastDateBlocked'));
        else if (msg.includes('fully booked') || msg.includes('already approved')) toast.error(t('majlisBooking.dateApprovedFullyBooked'));
        else if (msg.includes('3 hours')) toast.error(t('majlisBooking.sameDayConflict'));
        else toast.error(msg || t('common.noData'));
        info.revert();
      });
  }

  const pendingList = bookings.filter((b) => b.status === 'Pending');

  if (loading) {
    return (
      <div className="majlis-booking-page">
        <Header title={t('majlisBooking.title')} />
        <div className="page-content"><p className="loading-state">{t('common.loading')}</p></div>
      </div>
    );
  }

  return (
    <div className="majlis-booking-page">
      <Header title={t('majlisBooking.title')} />
      <div className="page-content">
        <p className="majlis-intro">{t('majlisBooking.intro')}</p>

        <div className="majlis-layout">
          <Card className="majlis-calendar-card">
            <CardHeader>
              <CardTitle>{t('majlisBooking.calendar')}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="calendar-wrap">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={events}
                  editable={isAdminRole}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  dayCellDidMount={dayCellDidMount}
                  eventDrop={handleEventDrop}
                  headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                  height="100%"
                />
              </div>
              <div className="calendar-legend">
                <span className="legend-item" style={{ background: STATUS_COLORS.Pending }}>{t('majlisBooking.pending')}</span>
                <span className="legend-item" style={{ background: STATUS_COLORS.Approved }}>{t('majlisBooking.approved')}</span>
                <span className="legend-item" style={{ background: STATUS_COLORS.Rejected }}>{t('majlisBooking.rejected')}</span>
              </div>
            </CardBody>
          </Card>

          {isAdminRole && (
            <Card className="majlis-admin-card">
              <CardHeader>
                <CardTitle>{t('majlisBooking.adminRequests')}</CardTitle>
              </CardHeader>
              <CardBody>
                {pendingList.length === 0 ? (
                  <p className="empty-state">{t('majlisBooking.noPending')}</p>
                ) : (
                  <ul className="pending-list">
                    {pendingList.map((b) => (
                      <li key={b.id} className="pending-item">
                        <div>
                          <strong>{b.date}{(b.startTime || b.endTime) ? ` · ${[b.startTime, b.endTime].filter(Boolean).join(' – ')}` : ''}</strong>
                          <span className="pending-request-name">{b.name}</span>
                          {b.notes && <p className="pending-notes">{b.notes}</p>}
                        </div>
                        <div className="pending-actions">
                          <Button variant="outline" className="btn--sm" onClick={() => approveReject(b.id, 'Approved')} aria-label={t('majlisBooking.approve')}>
                            <Check size={16} /> {t('majlisBooking.approve')}
                          </Button>
                          <Button variant="outline" className="btn--sm" onClick={() => approveReject(b.id, 'Rejected')} aria-label={t('majlisBooking.reject')}>
                            <X size={16} /> {t('majlisBooking.reject')}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

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

      <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title={t('majlisBooking.bookingDetails')}>
        {viewBooking && (
          <div className="majlis-view-booking">
            <p className="majlis-view-row"><strong>{t('majlisBooking.date')}:</strong> {new Date(viewBooking.date + 'T12:00:00').toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
            {(viewBooking.startTime || viewBooking.endTime) && (
              <p className="majlis-view-row"><strong>{t('majlisBooking.startTime')} / {t('majlisBooking.endTime')}:</strong> {[viewBooking.startTime, viewBooking.endTime].filter(Boolean).join(' – ')}</p>
            )}
            <p className="majlis-view-row"><strong>{t('majlisBooking.name')}:</strong> {viewBooking.name}</p>
            {viewBooking.notes && <p className="majlis-view-row"><strong>{t('majlisBooking.notes')}:</strong> {viewBooking.notes}</p>}
            <p className="majlis-view-row"><strong>{t('common.status')}:</strong> {viewBooking.status === 'Approved' ? t('majlisBooking.approved') : viewBooking.status === 'Rejected' ? t('majlisBooking.rejected') : t('majlisBooking.pending')}</p>
            <div className="modal-actions">
              <Button type="button" variant="outline" onClick={() => setViewBooking(null)}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedDate(null); }} title={t('majlisBooking.requestBooking')}>
        <form onSubmit={handleSubmit(onSubmitRequest)} noValidate>
          <input type="hidden" {...register('date', { required: true })} />
          <FormField label={t('majlisBooking.date')} required>
            <input
              type="text"
              value={selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { dateStyle: 'long' }) : ''}
              readOnly
              disabled
              tabIndex={-1}
              aria-readonly="true"
              className="majlis-date-frozen"
            />
          </FormField>
          <FormField label={t('majlisBooking.startTime')}>
            <input type="time" {...register('startTime')} />
          </FormField>
          <FormField label={t('majlisBooking.endTime')}>
            <input type="time" {...register('endTime')} />
          </FormField>
          <FormField label={t('majlisBooking.name')} required error={errors.name?.message ? t('majlisBooking.nameRequired') : undefined}>
            <input type="text" placeholder={t('majlisBooking.namePlaceholder')} {...register('name', { required: true })} />
          </FormField>
          <FormField label={t('majlisBooking.notes')} error={errors.notes?.message}>
            <textarea {...register('notes')} placeholder={t('majlisBooking.notesPlaceholder')} />
          </FormField>
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('majlisBooking.submitRequest')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
