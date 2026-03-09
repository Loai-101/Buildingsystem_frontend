import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { LottieLoading } from '../components/LottieLoading';
import { Card, CardBody } from '../components/Cards/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modals/Modal';
import { ConfirmDialog } from '../components/Modals/ConfirmDialog';
import { FormField } from '../components/FormField';
import { getYearsWithRecords, addYear, deleteYear, getRecordsByYear } from '../services/accountsService';
import { getApiErrorMessage } from '../services/api';
import { useAuthStore, isAdmin } from '../store/useAuthStore';
import { useTranslation } from '../i18n';
import toast from 'react-hot-toast';
import { ChevronRight, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import './Accounts.css';

const MONTH_KEYS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const currentYear = new Date().getFullYear();

export function Accounts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const admin = isAdmin();
  const [view, setView] = useState('years');
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addYearModalOpen, setAddYearModalOpen] = useState(false);
  const [newYear, setNewYear] = useState(currentYear);
  const [yearRecords, setYearRecords] = useState([]);
  const [yearDashboardLoading, setYearDashboardLoading] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', variant: 'danger', confirmLabel: '', onConfirm: null });
  const yearCacheRef = useRef(Object.create(null)); // { yearNum: records[] } for instant show when revisiting

  // Open months view for a specific year when navigating back from a month (e.g. "Back to months")
  useEffect(() => {
    const openYear = location.state?.openYear;
    if (openYear != null && Number.isInteger(Number(openYear))) {
      setView('months');
      setSelectedYear(Number(openYear));
      navigate('/accounts', { replace: true, state: {} });
    }
  }, [location.state?.openYear, navigate]);

  function loadYears() {
    if (!token) return;
    setLoading(true);
    getYearsWithRecords()
      .then((list) => setYears(Array.isArray(list) ? list : []))
      .catch((err) => {
        setYears([]);
        const msg = err.response?.status === 401 ? t('login.invalidCredentials') : (getApiErrorMessage(err) || t('common.noData'));
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getYearsWithRecords()
      .then((list) => {
        if (!cancelled) setYears(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setYears([]);
          const msg = err.response?.status === 401 ? t('login.invalidCredentials') : (getApiErrorMessage(err) || t('common.noData'));
          toast.error(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!token || view !== 'months' || selectedYear == null || selectedYear === '') {
      setYearRecords([]);
      setYearDashboardLoading(false);
      return;
    }
    const yearNum = Number(selectedYear);
    if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
      setYearRecords([]);
      setYearDashboardLoading(false);
      return;
    }
    if (yearNum in yearCacheRef.current) {
      const cached = yearCacheRef.current[yearNum];
      setYearRecords(Array.isArray(cached) ? cached : []);
      setYearDashboardLoading(false);
    } else {
      setYearRecords([]);
      setYearDashboardLoading(true);
    }
    let cancelled = false;
    getRecordsByYear(yearNum)
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        if (!cancelled) {
          yearCacheRef.current[yearNum] = arr;
          setYearRecords(arr);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setYearRecords([]);
          toast.error(getApiErrorMessage(err) || t('accounts.errorLoadingRecords'));
        }
      })
      .finally(() => {
        if (!cancelled) setYearDashboardLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, view, selectedYear]);

  const yearStats = useMemo(() => {
    const byMonth = {};
    for (let m = 1; m <= 12; m++) byMonth[m] = { income: 0, expense: 0 };
    yearRecords.forEach((r) => {
      const month = Number(r.month);
      if (month >= 1 && month <= 12) {
        const amt = Number(r.amount) || 0;
        if (r.type === 'Income') byMonth[month].income += amt;
        else byMonth[month].expense += amt;
      }
    });
    let totalIncome = 0;
    let totalExpense = 0;
    let bestIncomeMonth = 0;
    let bestIncomeAmount = 0;
    let mostExpenseMonth = 0;
    let mostExpenseAmount = 0;
    for (let m = 1; m <= 12; m++) {
      totalIncome += byMonth[m].income;
      totalExpense += byMonth[m].expense;
      if (byMonth[m].income > bestIncomeAmount) {
        bestIncomeAmount = byMonth[m].income;
        bestIncomeMonth = m;
      }
      if (byMonth[m].expense > mostExpenseAmount) {
        mostExpenseAmount = byMonth[m].expense;
        mostExpenseMonth = m;
      }
    }
    const monthNets = {};
    const monthHasData = {};
    for (let m = 1; m <= 12; m++) {
      monthNets[m] = byMonth[m].income - byMonth[m].expense;
      monthHasData[m] = byMonth[m].income > 0 || byMonth[m].expense > 0;
    }
    return {
      net: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      bestIncomeMonth: bestIncomeAmount > 0 ? bestIncomeMonth : 0,
      bestIncomeAmount,
      mostExpenseMonth: mostExpenseAmount > 0 ? mostExpenseMonth : 0,
      mostExpenseAmount,
      monthNets,
      monthHasData,
    };
  }, [yearRecords]);

  function handleYearClick(year) {
    setSelectedYear(year);
    setView('months');
  }

  function handleMonthClick(month) {
    navigate(`/accounts/${selectedYear}/${month}`, { state: { prefetchedYearRecords: yearRecords } });
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

  function handleDeleteYear(e, year) {
    e.preventDefault();
    e.stopPropagation();
    const yearNum = Number(year);
    setConfirm({
      open: true,
      title: t('accounts.deleteYear'),
      message: t('accounts.deleteYearConfirm', { year }),
      variant: 'danger',
      confirmLabel: t('common.delete'),
      onConfirm: () => {
        deleteYear(yearNum)
          .then(() => {
            delete yearCacheRef.current[yearNum];
            toast.success(t('accounts.yearDeleted', { year: yearNum }));
            loadYears();
          })
          .catch((err) => {
            const msg = err.response?.data?.error || err.message || t('common.noData');
            toast.error(msg);
          })
          .finally(() => setConfirm((c) => ({ ...c, open: false })));
      },
    });
  }

  const monthNames = MONTH_KEYS.map((k) => t(`months.${k}`));

  if (loading && years.length === 0) {
    return (
      <div className="accounts-page">
        <Header title={t('accounts.title')} />
        <div className="page-content">
          <LottieLoading message={t('common.loading')} />
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
                    <div className="year-card-actions" onClick={(e) => e.stopPropagation()}>
                      {admin && (
                        <button
                          type="button"
                          className="year-card-delete"
                          onClick={(e) => handleDeleteYear(e, year)}
                          title={t('accounts.deleteYear')}
                          aria-label={t('accounts.deleteYear')}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <ChevronRight size={20} className="year-card-arrow" />
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </>
        )}
        {view === 'months' && selectedYear && (
          <>
            <p className="accounts-intro">{t('accounts.selectMonth', { year: selectedYear })}</p>
            {yearDashboardLoading ? (
              <div className="accounts-year-loading">
                <LottieLoading message={t('accounts.loadingYearData')} inline />
              </div>
            ) : (
              <>
                <Card className="accounts-year-dashboard">
                  <CardBody>
                    <h2 className="year-dashboard-title">{t('accounts.yearDashboard')} — {selectedYear}</h2>
                    <div className="year-dashboard-stats">
                      <div className={`year-dashboard-stat year-dashboard-stat--net year-dashboard-net--${yearStats.net >= 0 ? 'positive' : 'negative'}`}>
                        <div className="year-dashboard-stat-text">
                          <span className="year-dashboard-label">{t('accounts.yearNet')}</span>
                          <span className="year-dashboard-value">
                            {yearStats.net >= 0 ? '+' : ''} BD {yearStats.net.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="year-dashboard-stat year-dashboard-stat--income">
                        <TrendingUp size={22} aria-hidden className="year-dashboard-icon" />
                        <div className="year-dashboard-stat-text">
                          <span className="year-dashboard-label">{t('accounts.bestMonthIncome')}</span>
                          <span className="year-dashboard-value">
                            {yearStats.bestIncomeMonth ? t(`months.${MONTH_KEYS[yearStats.bestIncomeMonth - 1]}`) : '—'}
                            <em className="year-dashboard-amount"> BD {yearStats.bestIncomeAmount.toLocaleString()}</em>
                          </span>
                        </div>
                      </div>
                      <div className="year-dashboard-stat year-dashboard-stat--expense">
                        <TrendingDown size={22} aria-hidden className="year-dashboard-icon" />
                        <div className="year-dashboard-stat-text">
                          <span className="year-dashboard-label">{t('accounts.mostExpenseMonth')}</span>
                          <span className="year-dashboard-value">
                            {yearStats.mostExpenseMonth ? t(`months.${MONTH_KEYS[yearStats.mostExpenseMonth - 1]}`) : '—'}
                            <em className="year-dashboard-amount"> BD {yearStats.mostExpenseAmount.toLocaleString()}</em>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <div className="accounts-month-grid">
                  {monthNames.map((name, index) => {
                    const month = index + 1;
                    const net = yearStats.monthNets[month] ?? 0;
                    const hasData = yearStats.monthHasData[month] ?? false;
                    const variant = hasData && net > 0 ? 'positive' : hasData && net < 0 ? 'negative' : 'neutral';
                    return (
                      <Card
                        key={month}
                        className={`card card--clickable month-card month-card--${variant}`}
                        onClick={() => handleMonthClick(month)}
                      >
                        <CardBody>
                          <div className="month-card-top">
                            <span className="month-card-name">{name}</span>
                            <ChevronRight size={20} className="month-card-arrow" />
                          </div>
                          <div className={`month-card-net month-card-net--${variant}`}>
                            {hasData && net > 0 ? '+' : ''} BD {net.toLocaleString()}
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
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
