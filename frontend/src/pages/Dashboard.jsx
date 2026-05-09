import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertTriangle, ListTodo, FolderOpen, User } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );

  const stats = data?.stats || {};
  const cards = [
    { label: 'Total Tasks', value: stats.total || 0, icon: ListTodo, color: 'bg-blue-100 text-blue-600' },
    { label: 'In Progress', value: stats.inProgress || 0, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Completed', value: stats.done || 0, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Overdue', value: stats.overdue || 0, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
    { label: 'My Tasks', value: stats.myTasks || 0, icon: User, color: 'bg-purple-100 text-purple-600' },
    { label: 'Projects', value: data?.projects?.length || 0, icon: FolderOpen, color: 'bg-indigo-100 text-indigo-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
        <p className="text-gray-500">Here's what's happening across your projects.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Tasks</h2>
          {data?.recentTasks?.length === 0 ? (
            <p className="text-gray-400 text-sm">No tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {data?.recentTasks?.map(task => (
                <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.project?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    task.status === 'Done' ? 'bg-green-100 text-green-700' :
                    task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Your Projects</h2>
            <Link to="/projects" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {data?.projects?.length === 0 ? (
            <p className="text-gray-400 text-sm">No projects yet.</p>
          ) : (
            <div className="space-y-3">
              {data?.projects?.slice(0, 5).map(project => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {project.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{project.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}