import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card, CardBody } from '../components/Cards/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modals/Modal';
import { FormField } from '../components/FormField';
import { getYearsWithRecords, addYear } from '../services/accountsService';
import { useAuthStore, isAdmin } from '../store/useAuthStore';
import { useTranslation } from '../i18n';
import toast from 'react-hot-toast';
import { ChevronRight, Plus } from 'lucide-react';
import './Accounts.css';

const MONTH_KEYS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const currentYear = new Date().getFullYear();

export function Accounts() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const admin = isAdmin();
  const [view, setView] = useState('years');
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addYearModalOpen, setAddYearModalOpen] = useState(false);
  const [newYear, setNewYear] = useState(currentYear);

  function loadYears() {
    setLoading(true);
    getYearsWithRecords().then(setYears).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadYears();
  }, []);

  function handleYearClick(year) {
    setSelectedYear(year);
    setView('months');
  }

  function handleMonthClick(month) {
    navigate(`/accounts/${selectedYear}/${month}`);
  }

  function handleBack() {
    if (view === 'months') {
      setView('years');
      setSelectedYear(null);
    }
  }

  function handleAddYear(e) {
    e.preventDefault();
    const y = Number(newYear);
    if (!y || y < 2000 || y > 2100) {
      toast.error(t('accounts.validYear'));
      return;
    }
    addYear(y)
      .then(() => {
        toast.success(t('accounts.yearAdded', { year: y }));
        setAddYearModalOpen(false);
        setNewYear(currentYear);
        loadYears();
      })
      .catch((err) => toast.error(err.message || t('accounts.validYear')));
  }

  const monthNames = MONTH_KEYS.map((k) => t(`months.${k}`));

  if (loading && years.length === 0) {
    return (
      <div className="accounts-page">
        <Header title={t('accounts.title')} />
        <div className="page-content">
          <p className="loading-state">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accounts-page">
      <Header title={t('accounts.title')}>
        {view === 'months' && (
          <button type="button" className="back-link" onClick={handleBack}>
            {t('accounts.backToYears')}
          </button>
        )}
        {view === 'years' && admin && (
          <Button onClick={() => { setNewYear(currentYear); setAddYearModalOpen(true); }}>
            <Plus size={18} />
            {t('accounts.addYear')}
          </Button>
        )}
      </Header>
      <div className="page-content">
        {view === 'years' && (
          <>
            <p className="accounts-intro">{t('accounts.selectYear')}</p>
            <div className="accounts-year-grid">
              {years.map((year) => (
                <Card
                  key={year}
                  className="card card--clickable year-card"
                  onClick={() => handleYearClick(year)}
                >
                  <CardBody>
                    <span className="year-card-value">{year}</span>
                    <ChevronRight size={20} className="year-card-arrow" />
                  </CardBody>
                </Card>
              ))}
            </div>
          </>
        )}
        {view === 'months' && selectedYear && (
          <>
            <p className="accounts-intro">{t('accounts.selectMonth', { year: selectedYear })}</p>
            <div className="accounts-month-grid">
              {monthNames.map((name, index) => {
                const month = index + 1;
                return (
                  <Card
                    key={month}
                    className="card card--clickable month-card"
                    onClick={() => handleMonthClick(month)}
                  >
                    <CardBody>
                      <span className="month-card-name">{name}</span>
                      <ChevronRight size={20} className="month-card-arrow" />
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {admin && (
        <Modal open={addYearModalOpen} onClose={() => setAddYearModalOpen(false)} title={t('accounts.addYearModalTitle')}>
          <form onSubmit={handleAddYear} noValidate>
            <FormField label={t('accounts.year')} required>
              <input
                type="number"
                min={2000}
                max={2100}
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder={String(currentYear)}
                aria-label={t('accounts.year')}
              />
            </FormField>
            <div className="modal-actions">
              <Button type="button" variant="outline" onClick={() => setAddYearModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('accounts.addYearBtn')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
