import React, { useState } from 'react';
import { Plus, Calendar, AlertTriangle, CheckCircle, Clock, User, DollarSign } from 'lucide-react';
import { MaintenanceTask } from '../../types';
import { mockMaintenanceTasks, mockBuildings } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

const MaintenanceModule: React.FC = () => {
  const { user } = useAuth();
  const [tasks] = useState<MaintenanceTask[]>(mockMaintenanceTasks);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredTasks = tasks.filter(task => {
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    return matchesPriority && matchesStatus;
  });

  const getBuildingName = (buildingId: string) => {
    const building = mockBuildings.find(b => b.id === buildingId);
    return building?.name || 'Bâtiment inconnu';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in-progress': return 'En cours';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Clock;
      case 'pending': return AlertTriangle;
      default: return Clock;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const canEdit = user?.role === 'admin' || user?.role === 'agent';

  const taskStats = {
    total: tasks.length,
    urgent: tasks.filter(t => t.priority === 'urgent').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    totalCost: tasks.reduce((sum, t) => sum + t.estimatedCost, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de la Maintenance</h1>
          <p className="text-gray-600 mt-1">Suivi et planification des interventions de maintenance</p>
        </div>
        {canEdit && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nouvelle Tâche</span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tâches</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-red-600">{taskStats.urgent}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Cours</p>
              <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Terminées</p>
              <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget Total</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(taskStats.totalCost)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes les priorités</option>
              <option value="urgent">Urgent</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in-progress">En cours</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            {filteredTasks.length} tâche(s) trouvée(s)
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const StatusIcon = getStatusIcon(task.status);
          const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
          
          return (
            <div key={task.id} className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
              isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <StatusIcon className={`w-5 h-5 ${
                      task.status === 'completed' ? 'text-green-600' :
                      task.status === 'in-progress' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`} />
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {getPriorityText(task.priority)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                    {isOverdue && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        En retard
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Bâtiment:</span>
                      <p className="text-gray-900">{getBuildingName(task.buildingId)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Assigné à:</span>
                      <div className="flex items-center mt-1">
                        <User className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="text-gray-900">{task.assignedTo}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Échéance:</span>
                      <div className="flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Coût estimé:</span>
                      <div className="flex items-center mt-1">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="text-gray-900 font-medium">{formatCurrency(task.estimatedCost)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {canEdit && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md border border-blue-200 hover:bg-blue-50 transition-colors">
                      Modifier
                    </button>
                    {task.status === 'pending' && (
                      <button className="text-green-600 hover:text-green-800 px-3 py-1 rounded-md border border-green-200 hover:bg-green-50 transition-colors">
                        Démarrer
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button className="text-purple-600 hover:text-purple-800 px-3 py-1 rounded-md border border-purple-200 hover:bg-purple-50 transition-colors">
                        Terminer
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche trouvée</h3>
          <p className="text-gray-500">Aucune tâche de maintenance ne correspond aux critères sélectionnés.</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceModule;