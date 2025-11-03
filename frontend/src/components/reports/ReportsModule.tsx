import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, BarChart3, PieChart, TrendingUp, Eye } from 'lucide-react';
import { Report } from '../../types';

const ReportsModule: React.FC = () => {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const mockReports: Report[] = [
    {
      id: '1',
      title: 'Rapport Mensuel de Maintenance',
      type: 'maintenance',
      generatedAt: '2024-02-01T10:00:00Z',
      generatedBy: 'Jean Dupont',
      data: {},
      format: 'pdf'
    },
    {
      id: '2',
      title: 'Analyse Financière Q1 2024',
      type: 'financial',
      generatedAt: '2024-01-31T15:30:00Z',
      generatedBy: 'Marie Martin',
      data: {},
      format: 'excel'
    },
    {
      id: '3',
      title: 'Rapport de Capacité Janvier',
      type: 'capacity',
      generatedAt: '2024-01-30T09:15:00Z',
      generatedBy: 'Pierre Durand',
      data: {},
      format: 'pdf'
    },
    {
      id: '4',
      title: 'Rapport d\'Équipements 2023',
      type: 'equipment',
      generatedAt: '2024-01-15T14:20:00Z',
      generatedBy: 'Jean Dupont',
      data: {},
      format: 'pdf'
    },
    {
      id: '5',
      title: 'Rapport de Performance 2023',
      type: 'performance',
      generatedAt: '2024-01-10T11:45:00Z',
      generatedBy: 'Marie Martin',
      data: {},
      format: 'excel'
    }
  ];

  const reportTemplates = [
    {
      id: 'maintenance',
      title: 'Rapport de Maintenance',
      description: 'Suivi des interventions, coûts et planification',
      icon: BarChart3,
      color: 'blue'
    },
    {
      id: 'financial',
      title: 'Analyse Financière',
      description: 'Budget, coûts et analyse financière des hôpitaux',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'capacity',
      title: 'Rapport de Capacité',
      description: 'Capacité d\'accueil et taux d\'occupation',
      icon: PieChart,
      color: 'purple'
    },
    {
      id: 'equipment',
      title: 'Rapport d\'Équipements',
      description: 'État et maintenance des équipements médicaux',
      icon: FileText,
      color: 'yellow'
    },
    {
      id: 'performance',
      title: 'Rapport de Performance',
      description: 'Indicateurs de performance et qualité des soins',
      icon: TrendingUp,
      color: 'indigo'
    }
  ];

  const filteredReports = mockReports.filter(report => {
    const matchesType = selectedType === 'all' || report.type === selectedType;
    return matchesType;
  });

  const getTypeText = (type: string) => {
    switch (type) {
      case 'maintenance': return 'Maintenance';
      case 'financial': return 'Financier';
      case 'capacity': return 'Capacité';
      case 'equipment': return 'Équipements';
      case 'performance': return 'Performance';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'capacity': return 'bg-purple-100 text-purple-800';
      case 'equipment': return 'bg-yellow-100 text-yellow-800';
      case 'performance': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'csv': return '📋';
      default: return '📄';
    }
  };

  const getTemplateColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'green': return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'purple': return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
      case 'yellow': return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      case 'indigo': return 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100';
      default: return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const getTemplateIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'purple': return 'text-purple-600';
      case 'yellow': return 'text-yellow-600';
      case 'indigo': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  const handleGenerateReport = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowGenerateModal(true);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports et Exports</h1>
          <p className="text-gray-600 mt-1">Génération et consultation des rapports d'analyse</p>
        </div>
      </div>

      {/* Report Templates */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Générer un Nouveau Rapport</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {reportTemplates.map((template) => (
            <div
              key={template.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${getTemplateColor(template.color)}`}
              onClick={() => handleGenerateReport(template.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <template.icon className={`w-8 h-8 ${getTemplateIconColor(template.color)}`} />
                <div className={`px-3 py-1 rounded-md text-sm font-medium text-white ${
                  template.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                  template.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                  template.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                  template.color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-indigo-600 hover:bg-indigo-700'
                } transition-colors`}>
                  Générer
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{template.title}</h4>
              <p className="text-sm text-gray-600">{template.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="maintenance">Maintenance</option>
              <option value="financial">Financier</option>
              <option value="capacity">Capacité</option>
              <option value="equipment">Équipements</option>
              <option value="performance">Performance</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            {filteredReports.length} rapport(s) trouvé(s)
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Générer un Rapport</h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                // Simulate report generation
                alert('Rapport généré avec succès !');
                setShowGenerateModal(false);
                setSelectedTemplate(null);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de rapport</label>
                    <input
                      type="text"
                      value={reportTemplates.find(t => t.id === selectedTemplate)?.title || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="current-month">Mois en cours</option>
                      <option value="last-month">Mois dernier</option>
                      <option value="current-quarter">Trimestre en cours</option>
                      <option value="last-quarter">Trimestre dernier</option>
                      <option value="current-year">Année en cours</option>
                      <option value="custom">Période personnalisée</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hôpitaux (optionnel)</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="all">Tous les hôpitaux</option>
                      <option value="chu-yaounde">CHU de Yaoundé</option>
                      <option value="hopital-douala">Hôpital Général de Douala</option>
                      <option value="hopital-bafoussam">Hôpital Provincial de Bafoussam</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGenerateModal(false);
                      setSelectedTemplate(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Générer le Rapport
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Rapports Générés</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rapport
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Généré par
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de génération
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(report.type)}`}>
                      {getTypeText(report.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{getFormatIcon(report.format)}</span>
                      <span className="text-sm text-gray-900 uppercase">{report.format}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.generatedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.generatedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1" title="Voir">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1" title="Télécharger">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rapport trouvé</h3>
          <p className="text-gray-500">Aucun rapport ne correspond aux critères sélectionnés.</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rapports ce mois</p>
              <p className="text-2xl font-bold text-blue-600">12</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Téléchargements</p>
              <p className="text-2xl font-bold text-green-600">48</p>
            </div>
            <Download className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rapports automatiques</p>
              <p className="text-2xl font-bold text-purple-600">8</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taille totale</p>
              <p className="text-2xl font-bold text-yellow-600">2.4 GB</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;