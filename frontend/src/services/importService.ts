import api from './api';

export interface TableStructure {
  table: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    key: string;
    auto_increment: boolean;
  }>;
  foreignKeys: {
    [key: string]: {
      referenced_table: string;
      referenced_column: string;
      options: Array<{ id: number; nom: string }>;
    };
  };
  requiredColumns: string[];
}

export interface ImportResult {
  total: number;
  success: number;
  errors: number;
  errorDetails: Array<{
    row: number;
    error: string;
  }>;
}

class ImportService {
  /**
   * Obtenir la liste des tables importables
   */
  async getImportableTables(): Promise<string[]> {
    const response = await api.get<{ success: boolean; data: string[] }>('/import/tables');
    return response.data.data;
  }

  /**
   * Obtenir la structure d'une table
   */
  async getTableStructure(table: string): Promise<TableStructure> {
    const response = await api.get<{ success: boolean; data: TableStructure }>(
      `/import/${table}/structure`
    );
    return response.data.data;
  }

  /**
   * Télécharger le fichier modèle Excel pour une table
   */
  async downloadTemplate(table: string): Promise<Blob> {
    const response = await api.get(`/import/${table}/template`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Importer des données depuis un fichier Excel
   */
  async importData(
    table: string,
    file: File,
    foreignKeyMappings?: { [key: string]: number }
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    if (foreignKeyMappings) {
      formData.append('foreignKeyMappings', JSON.stringify(foreignKeyMappings));
    }

    const response = await api.post<{ success: boolean; data: ImportResult }>(
      `/import/${table}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Télécharger un fichier (helper pour le template)
   */
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default new ImportService();
