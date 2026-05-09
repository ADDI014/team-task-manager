import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, UserPlus, CheckCircle, Clock, Circle, AlertCircle } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  'Todo': { color: 'bg-gray-100 text-gray-700', icon: Circle },
  'In Progress': { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  'Done': { color: 'bg-green-100 text-green-700', icon: CheckCircle }
};

const priorityColor = {
  'Low': 'bg-blue-100 text-blue-700',
  'Medium': 'bg-orange-100 text-orange-700',
  'High': 'bg-red-100 text-red-700'
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '', status: 'Todo'
  });
  const [memberEmail, setMemberEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}`)
      ]);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
    } catch {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tasks', { ...taskForm, projectId: id });
      toast.success('Task created!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '', status: 'Todo' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: 'Member' });
      toast.success('Member added!');
      setShowMemberModal(false);
      setMemberEmail('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    return true;
  });

  const isOwner = project?.owner?._id === user?._id || project?.owner === user?._id;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );

  const columns = ['Todo', 'In Progress', 'Done'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
          <p className="text-gray-500">{project?.description}</p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <UserPlus size={16} /> Add Member
            </button>
          )}
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500">Members:</span>
        {project?.members?.map(m => (
          <div
            key={m.user._id}
            title={`${m.user.name} (${m.role})`}
            className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold"
          >
            {m.user.name[0].toUpperCase()}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={filter.status}
          onChange={e => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option>Todo</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
        <select
          value={filter.priority}
          onChange={e => setFilter({ ...filter, priority: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Priority</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <span className="text-sm text-gray-500 flex items-center">{filteredTasks.length} tasks</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col);
          const { color, icon: Icon } = statusConfig[col];
          return (
            <div key={col} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Icon size={16} className={col === 'Done' ? 'text-green-600' : col === 'In Progress' ? 'text-yellow-600' : 'text-gray-600'} />
                <h3 className="font-semibold text-gray-800">{col}</h3>
                <span className="ml-auto bg-white text-gray-600 text-xs px-2 py-1 rounded-full border">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {colTasks.map(task => {
                  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';
                  return (
                    <div key={task._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 flex-1">{task.title}</h4>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-gray-300 hover:text-red-500 ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[task.priority]}`}>
                          {task.priority}
                        </span>
                        {isOverdue && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertCircle size={10} /> Overdue
                          </span>
                        )}
                      </div>
                      {task.dueDate && (
                        <p className={`text-xs mb-2 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                          Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </p>
                      )}
                      {task.assignedTo && (
                        <p className="text-xs text-gray-500 mb-3">
                          Assigned to: <span className="font-medium">{task.assignedTo.name}</span>
                        </p>
                      )}
                      <select
                        value={task.status}
                        onChange={e => handleUpdateStatus(task._id, e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option>Todo</option>
                        <option>In Progress</option>
                        <option>Done</option>
                      </select>
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No tasks here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text" required
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3} value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Todo</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date" value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={taskForm.assignedTo}
                  onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {project?.members?.map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Email</label>
                <input
                  type="email" required value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="member@example.com"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowMemberModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
                >
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
