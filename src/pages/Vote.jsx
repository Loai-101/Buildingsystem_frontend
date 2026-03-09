import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { LottieLoading } from '../components/LottieLoading';
import { Card, CardHeader, CardTitle, CardBody } from '../components/Cards/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modals/Modal';
import { ConfirmDialog } from '../components/Modals/ConfirmDialog';
import { FormField } from '../components/FormField';
import {
  getProposals,
  createProposal,
  voteProposal,
  deleteProposal,
  updateProposalStatus,
} from '../services/proposalService';
import { getApiErrorMessage } from '../services/api';
import { isAdmin } from '../store/useAuthStore';
import { useTranslation } from '../i18n';
import { Plus, ThumbsUp, ThumbsDown, Trash2, Lock, Unlock } from 'lucide-react';
import './Vote.css';

export function Vote() {
  const { t } = useTranslation();
  const isAdminRole = isAdmin();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposalsApiMissing, setProposalsApiMissing] = useState(false); // 404 from backend (e.g. not yet deployed)
  const [modalOpen, setModalOpen] = useState(false);
  const [detailProposal, setDetailProposal] = useState(null); // admin: selected proposal for detail view
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', variant: 'danger', confirmLabel: '', onConfirm: null });
  const votingRef = useRef(Object.create(null)); // avoid double submit
  const cacheRef = useRef(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { title: '', description: '' },
  });

  function load() {
    getProposals()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        cacheRef.current = arr;
        setProposals(arr);
      })
      .catch((err) => {
        setProposals([]);
        toast.error(getApiErrorMessage(err) || t('common.noData'));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (cacheRef.current !== null) {
      setProposals(Array.isArray(cacheRef.current) ? cacheRef.current : []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    let cancelled = false;
    getProposals()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        if (!cancelled) {
          cacheRef.current = arr;
          setProposals(arr);
          setProposalsApiMissing(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProposals([]);
          const is404 = err?.response?.status === 404;
          setProposalsApiMissing(!!is404);
          if (!is404) toast.error(getApiErrorMessage(err) || t('common.noData'));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function openAddModal() {
    reset({ title: '', description: '' });
    setModalOpen(true);
  }

  function onCreateProposal(data) {
    const title = (data.title || '').trim();
    if (!title) {
      toast.error(t('vote.titleRequired'));
      return;
    }
    createProposal({ title, description: (data.description || '').trim() })
      .then((created) => {
        toast.success(t('vote.proposalAdded'));
        setModalOpen(false);
        setProposals((prev) => [created, ...prev]);
        cacheRef.current = [created, ...(cacheRef.current || [])];
      })
      .catch((err) => toast.error(getApiErrorMessage(err) || t('common.noData')));
  }

  function handleVote(proposalId, vote) {
    if (votingRef.current[proposalId]) return;
    const p = proposals.find((x) => x.id === proposalId);
    if (!p || p.status === 'closed') return;
    votingRef.current[proposalId] = true;
    voteProposal(proposalId, vote)
      .then(({ approveCount, rejectCount, userVote: newUserVote }) => {
        setProposals((prev) =>
          prev.map((x) =>
            x.id === proposalId ? { ...x, approveCount, rejectCount, userVote: newUserVote ?? vote } : x
          )
        );
        if (cacheRef.current) {
          cacheRef.current = cacheRef.current.map((x) =>
            x.id === proposalId ? { ...x, approveCount, rejectCount, userVote: newUserVote ?? vote } : x
          );
        }
        toast.success(t('vote.voteRecorded'));
      })
      .catch((err) => {
        if (err.response?.status === 409 && err.response?.data?.userVote) {
          toast.error(t('vote.alreadyVoted'));
          setProposals((prev) =>
            prev.map((x) =>
              x.id === proposalId ? { ...x, userVote: err.response.data.userVote } : x
            )
          );
          if (cacheRef.current) {
            cacheRef.current = cacheRef.current.map((x) =>
              x.id === proposalId ? { ...x, userVote: err.response.data.userVote } : x
            );
          }
        } else {
          toast.error(getApiErrorMessage(err) || t('common.noData'));
        }
      })
      .finally(() => { delete votingRef.current[proposalId]; });
  }

  function handleCloseReopen(p) {
    const next = p.status === 'closed' ? 'open' : 'closed';
    updateProposalStatus(p.id, next)
      .then(() => {
        setProposals((prev) =>
          prev.map((x) => (x.id === p.id ? { ...x, status: next } : x))
        );
        if (cacheRef.current) {
          cacheRef.current = cacheRef.current.map((x) =>
            x.id === p.id ? { ...x, status: next } : x
          );
        }
        toast.success(next === 'closed' ? t('vote.proposalClosed') : t('vote.proposalReopened'));
      })
      .catch((err) => toast.error(getApiErrorMessage(err) || t('common.noData')));
  }

  function onDeleteProposal(p) {
    setConfirm({
      open: true,
      title: t('vote.deleteProposal'),
      message: t('vote.deleteProposalConfirm', { title: p.title }),
      variant: 'danger',
      confirmLabel: t('common.delete'),
      onConfirm: () => {
        deleteProposal(p.id)
          .then(() => {
            toast.success(t('vote.proposalDeleted'));
            setDetailProposal((prev) => (prev?.id === p.id ? null : prev));
            setProposals((prev) => prev.filter((x) => x.id !== p.id));
            cacheRef.current = (cacheRef.current || []).filter((x) => x.id !== p.id);
          })
          .catch((err) => toast.error(getApiErrorMessage(err) || t('common.noData')))
          .finally(() => setConfirm((c) => ({ ...c, open: false })));
      },
    });
  }


  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
  };

  if (loading) {
    return (
      <div className="vote-page">
        <Header title={t('vote.title')} />
        <div className="page-content"><LottieLoading message={t('common.loading')} /></div>
      </div>
    );
  }

  return (
    <div className="vote-page">
      <Header title={t('vote.title')}>
        {isAdminRole && (
          <Button onClick={openAddModal}>
            <Plus size={18} />
            {t('vote.addProposal')}
          </Button>
        )}
      </Header>
      <div className="page-content">
        <p className="vote-intro">{t('vote.intro')}</p>

        <Card className="vote-proposals">
          <CardHeader>
            <CardTitle>{t('vote.proposals')}</CardTitle>
          </CardHeader>
          <CardBody>
            {proposals.length === 0 ? (
              <p className="empty-state">
                {proposalsApiMissing ? t('vote.proposalsApiMissing') : t('vote.noProposals')}
              </p>
            ) : isAdminRole ? (
              <ul className="proposal-list proposal-list--admin-cards">
                {proposals.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`proposal-card proposal-card--compact proposal-card--${p.status}`}
                      onClick={() => setDetailProposal(p)}
                      aria-label={t('vote.viewDetails', { title: p.title })}
                    >
                      <span className="proposal-card-compact-title">{p.title}</span>
                      <span className="proposal-card-compact-meta">
                        {p.status === 'closed' && <span className="proposal-status-badge">{t('vote.closed')}</span>}
                        <span className="proposal-count-inline">
                          <ThumbsUp size={14} /> {p.approveCount ?? 0} · <ThumbsDown size={14} /> {p.rejectCount ?? 0}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="proposal-list">
                {proposals.map((p) => (
                  <li key={p.id} className={`proposal-card proposal-card--${p.status}`}>
                    <div className="proposal-main">
                      <h3 className="proposal-title">{p.title}</h3>
                      {p.description && <p className="proposal-description">{p.description}</p>}
                      <div className="proposal-meta">
                        <span className="proposal-created">{t('vote.by')} {p.createdBy}</span>
                        <span className="proposal-date">{formatDate(p.createdAt)}</span>
                        {p.status === 'closed' && <span className="proposal-status-badge">{t('vote.closed')}</span>}
                      </div>
                      <div className="proposal-counts">
                        <span className="proposal-count proposal-count--approve">
                          <ThumbsUp size={16} aria-hidden /> {p.approveCount ?? 0} {t('vote.approve')}
                        </span>
                        <span className="proposal-count proposal-count--reject">
                          <ThumbsDown size={16} aria-hidden /> {p.rejectCount ?? 0} {t('vote.reject')}
                        </span>
                      </div>
                      {p.status === 'open' && (
                        <div className="proposal-vote-actions">
                          {p.userVote ? (
                            <p className="proposal-you-voted">
                              {t('vote.youVoted')}: {p.userVote === 'approve' ? t('vote.approve') : t('vote.reject')}
                            </p>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleVote(p.id, 'approve')}
                              >
                                <ThumbsUp size={18} />
                                {t('vote.approve')}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleVote(p.id, 'reject')}
                              >
                                <ThumbsDown size={18} />
                                {t('vote.reject')}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
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

      {isAdminRole && detailProposal && (() => {
        const p = proposals.find((x) => x.id === detailProposal.id) ?? detailProposal;
        return (
          <Modal open={true} onClose={() => setDetailProposal(null)} title={p.title}>
            <div className="proposal-detail-modal">
              {p.description && <p className="proposal-description">{p.description}</p>}
              <div className="proposal-meta">
                <span className="proposal-created">{t('vote.by')} {p.createdBy}</span>
                <span className="proposal-date">{formatDate(p.createdAt)}</span>
                {p.status === 'closed' && <span className="proposal-status-badge">{t('vote.closed')}</span>}
                {p.status !== 'closed' && <span className="proposal-status-badge proposal-status-badge--open">{t('vote.open')}</span>}
              </div>
              <div className="proposal-counts">
                <span className="proposal-count proposal-count--approve">
                  <ThumbsUp size={16} aria-hidden /> {p.approveCount ?? 0} {t('vote.approve')}
                </span>
                <span className="proposal-count proposal-count--reject">
                  <ThumbsDown size={16} aria-hidden /> {p.rejectCount ?? 0} {t('vote.reject')}
                </span>
              </div>
              <div className="proposal-detail-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCloseReopen(p)}
                  title={p.status === 'closed' ? t('vote.reopen') : t('vote.close')}
                >
                  {p.status === 'closed' ? <Unlock size={16} /> : <Lock size={16} />}
                  {p.status === 'closed' ? t('vote.reopen') : t('vote.close')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="proposal-delete-btn"
                  onClick={() => onDeleteProposal(p)}
                  title={t('common.delete')}
                >
                  <Trash2 size={16} />
                  {t('common.delete')}
                </Button>
              </div>
              {Array.isArray(p.votes) && p.votes.length > 0 && (
                <div className="proposal-votes-detail">
                  <h4 className="proposal-votes-detail-title">{t('vote.voteDetails')}</h4>
                  <table className="proposal-votes-table" role="grid">
                    <thead>
                      <tr>
                        <th>{t('vote.resident')}</th>
                        <th>{t('vote.vote')}</th>
                        <th>{t('vote.votedAt')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.votes.map((v, i) => (
                        <tr key={i}>
                          <td>{v.username}</td>
                          <td>
                            <span className={`vote-badge vote-badge--${v.vote}`}>
                              {v.vote === 'approve' ? t('vote.approve') : t('vote.reject')}
                            </span>
                          </td>
                          <td>{formatDate(v.votedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {(!p.votes || p.votes.length === 0) && (
                <p className="proposal-detail-no-votes">{t('vote.noVotesYet')}</p>
              )}
              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setDetailProposal(null)}>{t('common.close')}</Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {isAdminRole && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('vote.addProposal')}>
          <form onSubmit={handleSubmit(onCreateProposal)} noValidate>
            <FormField label={t('vote.proposalTitle')} required error={errors.title?.message}>
              <input
                type="text"
                placeholder={t('vote.titlePlaceholder')}
                {...register('title', { required: true })}
                aria-label={t('vote.proposalTitle')}
              />
            </FormField>
            <FormField label={t('vote.proposalDescription')}>
              <textarea
                rows={3}
                placeholder={t('vote.descriptionPlaceholder')}
                {...register('description')}
                aria-label={t('vote.proposalDescription')}
              />
            </FormField>
            <div className="modal-actions">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('vote.addProposal')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
