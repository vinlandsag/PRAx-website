import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Copy,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  Send,
  X,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';

export default function TasksView({ searchQuery, onStatsUpdated }) {
  const { user, isStaff, isAdmin } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [previewTask, setPreviewTask] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDestructive: false });

  // Member submission within preview modal
  const [submitContent, setSubmitContent] = useState('');
  const [submitProof, setSubmitProof] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    category: '',
    reward_points: 100,
    deadline: '',
    submission_requirements: '',
    status: 'draft',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getTasks({
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });
      setTasks(res.tasks);
      setPagination(res.pagination);
      setCategories(res.categories);
    } catch (err) {
      toastError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter, sortBy, sortOrder, pagination.page, pagination.limit, toastError]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      instructions: '',
      category: categories[0] || 'Security & Audit',
      reward_points: 100,
      deadline: '',
      submission_requirements: '',
      status: 'draft',
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      instructions: task.instructions,
      category: task.category,
      reward_points: task.reward_points,
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      submission_requirements: task.submission_requirements,
      status: task.status,
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.instructions.trim()) errors.instructions = 'Instructions are required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.submission_requirements.trim()) errors.submission_requirements = 'Verification rubric is required';

    const pts = parseInt(formData.reward_points, 10);
    if (isNaN(pts) || pts <= 0) {
      errors.reward_points = 'Reward points must be greater than zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
        toastSuccess(`Task "${formData.title}" updated successfully.`);
      } else {
        await api.createTask(formData);
        toastSuccess(`Task "${formData.title}" published successfully.`);
      }
      setFormModalOpen(false);
      fetchTasks();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      toastError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDuplicate = async (taskId) => {
    try {
      const res = await api.duplicateTask(taskId);
      toastSuccess(`Task duplicated as Draft: "${res.task.title}"`);
      fetchTasks();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      toastError(err.message || 'Failed to duplicate task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.setTaskStatus(taskId, newStatus);
      toastSuccess(`Task status changed to ${newStatus}`);
      fetchTasks();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      toastError(err.message || 'Failed to update task status');
    }
  };

  const handleDeleteTask = (task) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Task',
      message: `Are you sure you want to permanently delete "${task.title}"? All submissions associated with this task will also be deleted.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.deleteTask(task.id);
          toastSuccess('Task deleted successfully.');
          setConfirmModal({ isOpen: false });
          fetchTasks();
          if (onStatsUpdated) onStatsUpdated();
        } catch (err) {
          toastError(err.message || 'Failed to delete task');
        }
      },
      onCancel: () => setConfirmModal({ isOpen: false }),
    });
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    if (!submitContent.trim()) {
      toastError('Submission description cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitTask(previewTask.id, {
        content: submitContent,
        proofUrl: submitProof,
      });
      toastSuccess('Your work has been submitted for review! Points will be awarded upon approval.');
      setSubmitContent('');
      setSubmitProof('');
      setPreviewTask(null);
      fetchTasks();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      toastError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar: Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#252C3A]">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#F3F5FA] flex items-center gap-2.5 font-display">
            Task Management
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#131722] text-[#A0A8B8] border border-[#252C3A]">
              {pagination.total} Tasks
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#A0A8B8]">
            Configure operational tasks, reward bounties, atomic duplications, and member submission workflows.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#6355d8] hover:from-[#9c90ff] hover:to-[#7466e3] text-white text-xs font-semibold shadow-lg shadow-[#8B7CFF]/20 flex items-center justify-center gap-2 transition-all a11y-focus min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Create New Task
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0D1017] p-4 rounded-2xl border border-[#252C3A]">
        <div>
          <label htmlFor="status-filter" className="block text-[11px] font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div>
          <label htmlFor="category-filter" className="block text-[11px] font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
            Category
          </label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort-by" className="block text-[11px] font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
            Sort Field
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF]"
          >
            <option value="created_at">Date Created</option>
            <option value="reward_points">Reward Points</option>
            <option value="deadline">Deadline</option>
            <option value="title">Title</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort-order" className="block text-[11px] font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
            Order
          </label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF]"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Tasks Table / Card List */}
      <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-[#737E91]">Loading operational tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-10 h-10 text-[#737E91] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#A0A8B8]">No tasks found</h3>
            <p className="text-xs text-[#737E91] mt-1 max-w-sm mx-auto">
              No tasks match your current filter criteria. Try clearing search filters or create a new task.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#A0A8B8]">
              <thead className="bg-[#08090D] text-[11px] font-semibold text-[#737E91] uppercase tracking-wider border-b border-[#252C3A] font-mono">
                <tr>
                  <th scope="col" className="px-5 py-4">Task Details</th>
                  <th scope="col" className="px-4 py-4">Category</th>
                  <th scope="col" className="px-4 py-4">Reward</th>
                  <th scope="col" className="px-4 py-4">Status</th>
                  <th scope="col" className="px-4 py-4">Submissions</th>
                  <th scope="col" className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252C3A]/60">
                {tasks.map((task) => {
                  let statusBadge = 'bg-[#131722] text-[#A0A8B8] border-[#252C3A]';
                  if (task.status === 'active') statusBadge = 'bg-[#48D6A0]/15 text-[#48D6A0] border-[#48D6A0]/30';
                  if (task.status === 'inactive') statusBadge = 'bg-[#FF6B78]/15 text-[#FF6B78] border-[#FF6B78]/30';
                  if (task.status === 'draft') statusBadge = 'bg-[#F2BD69]/15 text-[#F2BD69] border-[#F2BD69]/30';

                  const isExpired = task.deadline && new Date(task.deadline) < new Date();

                  return (
                    <tr key={task.id} className="hover:bg-[#131722]/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#F3F5FA] tracking-tight leading-snug">
                          {task.title}
                        </div>
                        <div className="text-xs text-[#A0A8B8] mt-1 line-clamp-1 max-w-md">
                          {task.description}
                        </div>
                        {task.deadline && (
                          <div className={`text-[11px] font-mono mt-1 flex items-center gap-1 ${isExpired ? 'text-[#FF6B78] font-semibold' : 'text-[#737E91]'}`}>
                            <Calendar className="w-3 h-3" />
                            Deadline: {new Date(task.deadline).toLocaleDateString()} {isExpired && '(Expired)'}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-[#131722] border border-[#252C3A] text-[#A0A8B8] font-medium font-mono">
                          {task.category}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#F2BD69] flex items-center gap-1 font-mono">
                          <Sparkles className="w-3.5 h-3.5" />
                          {task.reward_points} pts
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusBadge}`}>
                          {task.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-[#F3F5FA] font-mono">
                          {task.total_submissions} total
                        </div>
                        <div className="text-[11px] text-[#737E91] font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="text-[#F2BD69]">{task.pending_submissions || 0} pending</span> ·{' '}
                          <span className="text-[#48D6A0]">{task.approved_submissions || 0} approved</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview as member */}
                          <button
                            type="button"
                            onClick={() => setPreviewTask(task)}
                            title="Preview Task as Member"
                            className="p-2 text-[#737E91] hover:text-[#F3F5FA] rounded-lg hover:bg-[#131722] transition-colors a11y-focus min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <>
                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                title="Edit Task"
                                className="p-2 text-[#737E91] hover:text-[#8B7CFF] rounded-lg hover:bg-[#131722] transition-colors a11y-focus min-w-[36px] min-h-[36px] flex items-center justify-center"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Duplicate */}
                              <button
                                type="button"
                                onClick={() => handleDuplicate(task.id)}
                                title="Duplicate Task Configuration"
                                className="p-2 text-[#737E91] hover:text-[#F2BD69] rounded-lg hover:bg-[#131722] transition-colors a11y-focus min-w-[36px] min-h-[36px] flex items-center justify-center"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* Toggle Status (Active / Inactive) */}
                              {task.status === 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(task.id, 'inactive')}
                                  title="Deactivate Task"
                                  className="p-2 text-[#737E91] hover:text-[#FF6B78] rounded-lg hover:bg-[#131722] transition-colors a11y-focus min-w-[36px] min-h-[36px] flex items-center justify-center"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(task.id, 'active')}
                                  title="Activate Task"
                                  className="p-2 text-[#737E91] hover:text-[#48D6A0] rounded-lg hover:bg-[#131722] transition-colors a11y-focus min-w-[36px] min-h-[36px] flex items-center justify-center"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task)}
                                title="Delete Task"
                                className="p-2 text-[#737E91] hover:text-[#FF6B78] rounded-lg hover:bg-[#131722] transition-colors a11y-focus min-w-[36px] min-h-[36px] flex items-center justify-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[#252C3A] flex items-center justify-between text-xs text-[#737E91] font-mono">
            <span>
              Showing {tasks.length} of {pagination.total} tasks (Page {pagination.page} of {pagination.totalPages})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#252C3A] bg-[#131722] text-[#A0A8B8] hover:text-[#F3F5FA] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#191F2B]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#252C3A] bg-[#131722] text-[#A0A8B8] hover:text-[#F3F5FA] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#191F2B]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT TASK MODAL */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090D]/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-6 text-[#F3F5FA] my-8">
            <h2 className="text-xl font-bold tracking-tight text-[#F3F5FA] mb-1 font-display">
              {editingTask ? 'Edit Task Configuration' : 'Create Operational Task'}
            </h2>
            <p className="text-xs text-[#A0A8B8] mb-6">
              Configure parameters, reward bounties, and submission verification rubrics.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="task-title" className="block text-xs font-semibold text-[#A0A8B8] mb-1">
                  Task Title *
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Audit Zero-Day Vulnerabilities in Auth Service"
                  className={`w-full px-3.5 py-2.5 bg-[#131722] border rounded-xl text-sm text-[#F3F5FA] placeholder-[#737E91] focus:outline-none ${
                    formErrors.title ? 'border-[#FF6B78]' : 'border-[#252C3A] focus:border-[#8B7CFF]'
                  }`}
                />
                {formErrors.title && <p className="text-xs text-[#FF6B78] mt-1">{formErrors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="task-category" className="block text-xs font-semibold text-[#A0A8B8] mb-1">
                    Category *
                  </label>
                  <input
                    id="task-category"
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Security & Audit"
                    className="w-full px-3.5 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA]"
                  />
                </div>

                <div>
                  <label htmlFor="task-points" className="block text-xs font-semibold text-[#A0A8B8] mb-1">
                    Reward Points *
                  </label>
                  <input
                    id="task-points"
                    type="number"
                    min="1"
                    value={formData.reward_points}
                    onChange={(e) => setFormData({ ...formData, reward_points: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-[#131722] border rounded-xl text-sm text-[#F3F5FA] font-mono ${
                      formErrors.reward_points ? 'border-[#FF6B78]' : 'border-[#252C3A] focus:border-[#8B7CFF]'
                    }`}
                  />
                  {formErrors.reward_points && <p className="text-xs text-[#FF6B78] mt-1">{formErrors.reward_points}</p>}
                </div>

                <div>
                  <label htmlFor="task-status" className="block text-xs font-semibold text-[#A0A8B8] mb-1">
                    Initial Status
                  </label>
                  <select
                    id="task-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA]"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="task-deadline" className="block text-xs font-semibold text-[#A0A8B8] mb-1">
                  Deadline (Optional)
                </label>
                <input
                  id="task-deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA] font-mono"
                />
              </div>

              <div>
                <label htmlFor="task-desc" className="block text-xs font-semibold text-[#A0A8B8] mb-1">
                  Description *
                </label>
                <textarea
                  id="task-desc"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="High-level overview of the task or bounty..."
                  className="w-full px-3.5 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA] placeholder-[#737E91]"
                />
              </div>

              <div>
                <label htmlFor="task-instructions" className="block text-xs font-semibold text-[#A0A8B8] mb-1">
                  Step-by-Step Instructions *
                </label>
                <textarea
                  id="task-instructions"
                  rows="3"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="1. Inspect endpoint... 2. Run test script... 3. Submit proof URL..."
                  className="w-full px-3.5 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA] placeholder-[#737E91] font-mono text-xs"
                />
              </div>

              <div>
                <label htmlFor="task-requirements" className="block text-xs font-semibold text-[#A0A8B8] mb-1">
                  Submission Verification Rubric *
                </label>
                <textarea
                  id="task-requirements"
                  rows="2"
                  value={formData.submission_requirements}
                  onChange={(e) => setFormData({ ...formData, submission_requirements: e.target.value })}
                  placeholder="Proof format required (e.g. GitHub PR, markdown report, test logs)..."
                  className="w-full px-3.5 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA] placeholder-[#737E91]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#252C3A]">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-[#252C3A] bg-[#131722] text-[#A0A8B8] hover:text-[#F3F5FA] text-xs font-semibold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#6355d8] hover:from-[#9c90ff] hover:to-[#7466e3] text-white text-xs font-semibold shadow-lg shadow-[#8B7CFF]/20 min-h-[44px]"
                >
                  {formSubmitting ? 'Saving...' : editingTask ? 'Update Task' : 'Publish Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER TASK PREVIEW MODAL */}
      {previewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090D]/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-6 text-[#F3F5FA] my-8">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#252C3A]">
              <div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30">
                  {previewTask.category}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-[#F3F5FA] mt-2 font-display">
                  {previewTask.title}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#A0A8B8] font-mono">
                  <span className="text-[#F2BD69] font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {previewTask.reward_points} Reward Points
                  </span>
                  {previewTask.deadline && (
                    <span>Deadline: {new Date(previewTask.deadline).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewTask(null)}
                className="p-2 text-[#737E91] hover:text-[#F3F5FA] rounded-lg hover:bg-[#131722] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
                  Description
                </h3>
                <p className="text-sm text-[#A0A8B8] leading-relaxed bg-[#131722] p-3 rounded-xl border border-[#252C3A]">
                  {previewTask.description}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
                  Instructions
                </h3>
                <div className="text-xs text-[#A0A8B8] leading-relaxed bg-[#131722] p-3 rounded-xl border border-[#252C3A] whitespace-pre-line font-mono">
                  {previewTask.instructions}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
                  Verification Requirements
                </h3>
                <p className="text-xs text-[#F2BD69] leading-relaxed bg-[#F2BD69]/10 p-3 rounded-xl border border-[#F2BD69]/20 font-mono">
                  {previewTask.submission_requirements}
                </p>
              </div>

              {/* Interactive Submit Work Form (Enables testing end-to-end flow!) */}
              <div className="pt-2 border-t border-[#252C3A]">
                <h3 className="text-sm font-bold text-[#F3F5FA] mb-2 flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#8B7CFF]" />
                  Submit Work for this Task
                </h3>

                {previewTask.status !== 'active' ? (
                  <div className="p-3 bg-[#131722] rounded-xl text-xs text-[#737E91] text-center font-mono">
                    This task is currently {previewTask.status} and cannot accept submissions.
                  </div>
                ) : (
                  <form onSubmit={handleMemberSubmit} className="space-y-3">
                    <div>
                      <label htmlFor="submit-content" className="block text-xs text-[#A0A8B8] mb-1">
                        Work Summary / Findings Description *
                      </label>
                      <textarea
                        id="submit-content"
                        rows="3"
                        value={submitContent}
                        onChange={(e) => setSubmitContent(e.target.value)}
                        placeholder="Detail your solution, steps taken, or testing methodology..."
                        className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA]"
                      />
                    </div>

                    <div>
                      <label htmlFor="submit-proof" className="block text-xs text-[#A0A8B8] mb-1">
                        Proof URL / PR / Gist Link
                      </label>
                      <input
                        id="submit-proof"
                        type="url"
                        value={submitProof}
                        onChange={(e) => setSubmitProof(e.target.value)}
                        placeholder="https://github.com/org/repo-audit-pr"
                        className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#6355d8] hover:from-[#9c90ff] hover:to-[#7466e3] text-white text-xs font-semibold shadow-lg shadow-[#8B7CFF]/20 flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      {submitting ? 'Submitting Work...' : `Submit Work (+${previewTask.reward_points} pts upon review)`}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}
