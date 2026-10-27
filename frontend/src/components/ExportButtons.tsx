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
        className="btn btn-outline"
        title="Exporter en PDF"
      >
        <FileDown className="size-4 text-danger" />
        <span className="hidden sm:inline">PDF</span>
      </button>
      <button
        onClick={onExportExcel}
        disabled={disabled}
        className="btn btn-outline"
        title="Exporter en Excel"
      >
        <FileSpreadsheet className="size-4 text-success" />
        <span className="hidden sm:inline">Excel</span>
      </button>
    </div>
  );
}
