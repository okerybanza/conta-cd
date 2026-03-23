import api from './api';

export type ExportFormat = 'pdf' | 'excel' | 'xml' | 'csv';

class FiscalExportService {
  /**
   * Exporter la déclaration TVA
   */
  async exportVATDeclaration(
    period: string, // Format: "2025-01"
    format: ExportFormat
  ): Promise<Blob> {
    const response = await api.get(`/fiscal-export/vat-declaration?period=${period}&format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Exporter pour contrôle fiscal
   */
  async exportFiscalControl(
    startDate: string,
    endDate: string,
    format: 'excel' | 'csv'
  ): Promise<Blob> {
    const response = await api.get(
      `/fiscal-export/fiscal-control?startDate=${startDate}&endDate=${endDate}&format=${format}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Télécharger un fichier blob
   */
  downloadBlob(blob: Blob, filename: string) {
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

export default new FiscalExportService();

