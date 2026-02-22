import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { Card, CardHeader, CardTitle, CardBody } from '../components/Cards/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modals/Modal';
import { FormField } from '../components/FormField';
import {
  getRecordsByYearMonth,
  addRecord,
  updateRecord,
  deleteRecord,
} from '../services/accountsService';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n';
import { Eye, Pencil, Trash2, Plus } from 'lucide-react';
import './AccountsMonth.css';

const MONTH_KEYS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const TYPES = ['Income', 'Expense'];
const CATEGORIES = {
  Income: ['Rent', 'Donations', 'Fees', 'Other'],
  Expense: ['Utilities', 'Maintenance', 'Repairs', 'Admin', 'Other'],
};

export function AccountsMonth() {
  const { year, month } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewAttachment, setViewAttachment] = useState(null);
  const [filterType, setFilterType] = useState(useAppStore.getState().accountsFilterType);
  const [filterCategory, setFilterCategory] = useState(useAppStore.getState().accountsFilterCategory);
  const [filterSearch, setFilterSearch] = useState(useAppStore.getState().accountsFilterSearch);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { type: 'Income', category: '', date: '', description: '', amount: '', attachmentBase64: '' },
  });
  const typeWatch = watch('type');
  register('attachmentBase64');

  useEffect(() => {
    useAppStore.getState().setAccountsFilters(filterType, filterCategory, filterSearch);
  }, [filterType, filterCategory, filterSearch]);

  useEffect(() => {
    setValue('category', '');
  }, [typeWatch, setValue]);

  function loadRecords() {
    getRecordsByYearMonth(year, month).then(setRecords).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRecords();
  }, [year, month]);

  const filteredRecords = useMemo(() => {
    let list = [...records];
    if (filterType) list = list.filter((r) => r.type === filterType);
    if (filterCategory) list = list.filter((r) => r.category === filterCategory);
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      list = list.filter(
        (r) =>
          (r.description || '').toLowerCase().includes(q) ||
          (r.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, filterType, filterCategory, filterSearch]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredRecords.forEach((r) => {
      const amt = Number(r.amount) || 0;
      if (r.type === 'Income') income += amt;
      else expense += amt;
    });
    return { income, expense, net: income - expense };
  }, [filteredRecords]);

  function openAddModal() {
    setEditingRecord(null);
    const d = new Date(Number(year), Number(month) - 1, 1);
    reset({
      type: 'Income',
      category: '',
      date: d.toISOString().slice(0, 10),
      description: '',
      amount: '',
      attachment: null,
    });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingRecord(record);
    reset({
      type: record.type,
      category: record.category,
      date: (record.date || '').slice(0, 10),
      description: record.description || '',
      amount: record.amount ?? '',
      attachmentBase64: '',
    });
    setModalOpen(true);
  }

  function onFormSubmit(data) {
    const dateStr = (data.date || '').slice(0, 10);
    const d = new Date(dateStr);
    const payload = {
      date: dateStr,
      type: data.type,
      category: data.category || (CATEGORIES[data.type] && CATEGORIES[data.type][0]),
      description: data.description || '',
      amount: Number(data.amount) || 0,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      attachment: data.attachmentBase64 || editingRecord?.attachment || null,
    };
    if (editingRecord) {
        updateRecord(editingRecord.id, payload)
        .then(() => {
          toast.success(t('accountsMonth.recordUpdated'));
          setModalOpen(false);
          loadRecords();
        })
        .catch(() => toast.error(t('accountsMonth.recordUpdated')));
    } else {
      addRecord(payload)
        .then(() => {
          toast.success(t('accountsMonth.recordAdded'));
          setModalOpen(false);
          loadRecords();
        })
        .catch(() => toast.error(t('accountsMonth.recordAdded')));
    }
  }

  function handleDelete(id) {
    if (!window.confirm(t('accountsMonth.deleteConfirm'))) return;
    deleteRecord(id).then(() => {
      toast.success(t('accountsMonth.recordDeleted'));
      loadRecords();
    }).catch(() => toast.error(t('common.noData')));
  }

  function onFileChange(e, setBase64) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setValue('attachmentBase64', reader.result);
    reader.readAsDataURL(file);
  }

  const monthName = t(`months.${MONTH_KEYS[Number(month) - 1]}`);
  const pageTitle = `${monthName} ${year}`;

  if (loading && records.length === 0) {
    return (
      <div className="accounts-month-page">
        <Header title={pageTitle} />
        <div className="page-content"><p className="loading-state">{t('common.loading')}</p></div>
      </div>
    );
  }

  return (
    <div className="accounts-month-page">
      <Header title={pageTitle}>
        <button type="button" className="back-link" onClick={() => navigate('/accounts')}>
          {t('accountsMonth.backToAccounts')}
        </button>
        <Button onClick={openAddModal}>
          <Plus size={18} />
          {t('accountsMonth.addRecord')}
        </Button>
      </Header>
      <div className="page-content">
        <Card className="accounts-month-filters">
          <CardBody>
            <div className="filters-row">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                aria-label={t('accountsMonth.type')}
              >
                <option value="">{t('accountsMonth.allTypes')}</option>
                {TYPES.map((typeVal) => (
                  <option key={typeVal} value={typeVal}>{t(`accountsMonth.${typeVal.toLowerCase()}`)}</option>
                ))}
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label={t('accountsMonth.category')}
              >
                <option value="">{t('accountsMonth.allCategories')}</option>
                {TYPES.flatMap((typeVal) => CATEGORIES[typeVal].map((c) => ({ type: typeVal, cat: c }))).map(({ cat }) => (
                  <option key={cat} value={cat}>{t(`accountsMonth.categories.${cat.toLowerCase()}`)}</option>
                ))}
              </select>
              <input
                type="search"
                placeholder={t('accountsMonth.searchPlaceholder')}
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="filter-search"
                aria-label={t('accountsMonth.searchPlaceholder')}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="accounts-month-totals">
          <CardBody>
            <div className="totals-row">
              <span className="total-item total-income">{t('accountsMonth.totalIncome')}: BD {totals.income.toLocaleString()}</span>
              <span className="total-item total-expense">{t('accountsMonth.totalExpense')}: BD {totals.expense.toLocaleString()}</span>
              <span className="total-item total-net">{t('accountsMonth.net')}: BD {totals.net.toLocaleString()}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('accountsMonth.records')}</CardTitle>
          </CardHeader>
          <CardBody>
            {filteredRecords.length === 0 ? (
              <p className="empty-state">{t('accountsMonth.noRecords')}</p>
            ) : (
              <ul className="records-list">
                {filteredRecords.map((r) => (
                  <li key={r.id} className="record-item">
                    <div className="record-main">
                      <span className="record-date">{r.date}</span>
                      <span className="record-type">{t(`accountsMonth.${r.type.toLowerCase()}`)}</span>
                      <span className="record-category">{r.category ? t(`accountsMonth.categories.${r.category.toLowerCase()}`) : '—'}</span>
                      {r.description && <span className="record-desc">{r.description}</span>}
                      <span className="record-amount">
                        {r.type === 'Income' ? '+' : '−'} BD {Number(r.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="record-meta">
                      {r.attachment && (
                        <button type="button" className="link-button" onClick={() => setViewAttachment(r.attachment)}>
                          {t('common.view')}
                        </button>
                      )}
                      <div className="actions-cell">
                        {r.attachment && (
                          <button type="button" className="icon-btn" onClick={() => setViewAttachment(r.attachment)} aria-label="View attachment">
                            <Eye size={16} />
                          </button>
                        )}
                        <button type="button" className="icon-btn" onClick={() => openEditModal(r)} aria-label="Edit">
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="icon-btn icon-btn--danger" onClick={() => handleDelete(r.id)} aria-label="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingRecord ? t('accountsMonth.editRecord') : t('accountsMonth.addRecordModal')}>
        <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
          <FormField label={t('accountsMonth.date')} required error={errors.date?.message}>
            <input type="date" {...register('date', { required: true })} />
          </FormField>
          <FormField label={t('accountsMonth.type')} required>
            <select {...register('type', { required: true })}>
              {TYPES.map((typeVal) => (
                <option key={typeVal} value={typeVal}>{t(`accountsMonth.${typeVal.toLowerCase()}`)}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t('accountsMonth.category')} required>
            <select {...register('category', { required: true })}>
              <option value="">{t('accountsMonth.allCategories')}</option>
              {(CATEGORIES[typeWatch] || []).map((c) => (
                <option key={c} value={c}>{t(`accountsMonth.categories.${c.toLowerCase()}`)}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t('accountsMonth.description')} error={errors.description?.message}>
            <input type="text" placeholder="" {...register('description')} />
          </FormField>
          <FormField label={`${t('accountsMonth.amount')} (BD)`} required error={errors.amount?.message}>
            <input type="number" step="0.01" min="0" placeholder="0" {...register('amount', { required: true, min: 0 })} />
          </FormField>
          <FormField label={t('accountsMonth.invoice')}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange(e)}
            />
            {watch('attachmentBase64') && (
              <div className="attachment-preview">
                <img src={watch('attachmentBase64')} alt="" />
              </div>
            )}
          </FormField>
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{editingRecord ? t('accountsMonth.update') : t('common.add')}</Button>
          </div>
        </form>
      </Modal>

      {viewAttachment && (
        <div className="modal-overlay" onClick={() => setViewAttachment(null)} role="dialog">
          <div className="attachment-view" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setViewAttachment(null)} aria-label="Close">×</button>
            <img src={viewAttachment} alt="Invoice" />
          </div>
        </div>
      )}
    </div>
  );
}
