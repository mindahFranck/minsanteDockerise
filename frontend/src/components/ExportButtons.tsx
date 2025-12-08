import React from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';

interface ExportButtonsProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Composant de boutons d'export PDF et Excel
 */
export default function ExportButtons({
  onExportPDF,
  onExportExcel,
  disabled = false,
  className = '',
}: ExportButtonsProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={onExportPDF}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        title="Exporter en PDF"
      >
        <FileDown className="w-4 h-4" />
        <span className="hidden sm:inline">PDF</span>
      </button>
      <button
        onClick={onExportExcel}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        title="Exporter en Excel"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span className="hidden sm:inline">Excel</span>
      </button>
    </div>
  );
}
