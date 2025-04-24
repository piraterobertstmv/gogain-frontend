import { useState } from 'react';
import { Modal, Button, Form, Alert, ProgressBar } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface PdfTransactionExporterProps {
  show: boolean;
  onHide: () => void;
  data: {
    transaction?: any[];
    client?: any[];
    users?: any[];
    center?: any[];
    service?: any[];
    costs?: any[];
    [key: string]: any;
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    [key: string]: any;
  };
  filters: {
    center: string[];
    client: string[];
    worker: string[];
    service: string[];
    [key: string]: string[];
  };
}

export function PdfTransactionExporter({ show, onHide, data, user, filters }: PdfTransactionExporterProps) {
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  });
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [exportType, setExportType] = useState<'all' | 'filtered'>('filtered');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Function to filter transactions based on filters and date range
  const filterTransactions = () => {
    if (!data.transaction) return [];

    let filteredTransactions = [...data.transaction];

    // Apply UI filters if exportType is "filtered"
    if (exportType === 'filtered') {
      if (filters.center.length > 0) {
        filteredTransactions = filteredTransactions.filter(t => 
          filters.center.includes(t.center)
        );
      }

      if (filters.client.length > 0) {
        filteredTransactions = filteredTransactions.filter(t => 
          filters.client.includes(t.client)
        );
      }

      if (filters.worker.length > 0) {
        filteredTransactions = filteredTransactions.filter(t => 
          filters.worker.includes(t.worker)
        );
      }

      if (filters.service.length > 0) {
        filteredTransactions = filteredTransactions.filter(t => 
          filters.service.includes(t.service)
        );
      }
    }

    // Apply date range filter
    filteredTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59); // Set to end of day for comparison
      
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    return filteredTransactions;
  };

  // Function to get entity name by ID
  const getEntityName = (entityType: 'client' | 'center' | 'service' | 'worker', id: string): string => {
    if (!id) return 'Unknown';

    try {
      // Handle special case for client when it's a supplier (might be a text value instead of ID)
      if (entityType === 'client') {
        // If we have original client name stored
        const transaction = data.transaction?.find(t => t.client === id);
        if (transaction?.originalClientName) {
          return transaction.originalClientName;
        }
        
        if (typeof id !== 'string' || !isValidObjectId(id)) {
          return id; // It's already a name, not an ID
        }
      }

      // Map entity type to proper data source
      const entityMap: Record<string, string> = {
        'client': 'client',
        'center': 'center',
        'service': 'service',
        'worker': 'users'
      };

      const dataSource = data[entityMap[entityType]];

      if (!Array.isArray(dataSource)) return id;

      const entity = dataSource.find((item: any) => item._id === id);
      
      if (!entity) return id;

      // Handle different entity types
      if (entityType === 'client' || entityType === 'worker') {
        return `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || id;
      } else {
        return entity.name || id;
      }
    } catch (error) {
      console.error(`Error getting ${entityType} name for ID ${id}:`, error);
      return id;
    }
  };

  // Simple function to check if a string is a valid MongoDB ObjectId format
  const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Function to format transactions for export
  const prepareExportData = (transactions: any[]) => {
    setProgress(10);
    
    const exportData = transactions.map((transaction, index) => {
      // Update progress as we process each transaction
      setProgress(10 + Math.floor((index / transactions.length) * 50));
      
      const cost = typeof transaction.cost === 'number' ? transaction.cost : 0;
      const taxes = typeof transaction.taxes === 'number' ? transaction.taxes : 0;
      const amountWithoutTaxes = cost / (1 + (taxes / 100));
      
      return {
        'Date': formatDate(transaction.date),
        'Center': transaction.originalCenterName || getEntityName('center', transaction.center),
        'Client': transaction.originalClientName || getEntityName('client', transaction.client),
        'Amount with taxes (€)': cost.toFixed(2),
        'Amount without taxes (€)': amountWithoutTaxes.toFixed(2),
        'Worker': transaction.originalWorkerName || getEntityName('worker', transaction.worker),
        'Taxes (%)': taxes,
        'Type': transaction.typeOfTransaction || '',
        'Movement': transaction.typeOfMovement || '',
        'Frequency': transaction.frequency || '',
        'Client Type': transaction.typeOfClient || '',
        'Service': transaction.originalServiceName || getEntityName('service', transaction.service)
      };
    });
    
    setProgress(60);
    return exportData;
  };

  // Format date functions
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
      return dateString;
    }
  };

  // Export to Excel
  const exportToExcel = (data: any[]) => {
    try {
      setProgress(70);
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      
      // Auto-size columns
      const colWidths = data.reduce((widths: Record<string, number>, row) => {
        Object.keys(row).forEach(key => {
          const value = String(row[key] || '');
          widths[key] = Math.max(widths[key] || 0, value.length);
        });
        return widths;
      }, {});
      
      ws['!cols'] = Object.keys(colWidths).map(key => ({ wch: colWidths[key] + 2 }));
      
      setProgress(85);
      XLSX.writeFile(wb, `GoGain_Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setProgress(100);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export to Excel. Please try again.');
      setProgress(0);
    }
  };

  // Export to PDF
  const exportToPdf = (data: any[]) => {
    try {
      setProgress(70);
      const doc = new jsPDF('landscape', 'pt', 'a4');
      
      // Add title
      doc.setFontSize(18);
      doc.text('GoGain Transactions', 40, 40);
      
      // Add date range
      doc.setFontSize(12);
      doc.text(`Date Range: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`, 40, 60);
      doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, 40, 80);
      
      // Prepare table data
      const columns = [
        { header: 'Date', dataKey: 'Date' },
        { header: 'Center', dataKey: 'Center' },
        { header: 'Client', dataKey: 'Client' },
        { header: 'Amount (€)', dataKey: 'Amount with taxes (€)' },
        { header: 'Worker', dataKey: 'Worker' },
        { header: 'Type', dataKey: 'Type' },
        { header: 'Service', dataKey: 'Service' }
      ];
      
      const tableData = data.map(row => {
        const mappedRow: Record<string, string> = {};
        columns.forEach(col => {
          mappedRow[col.dataKey] = row[col.dataKey] || '';
        });
        return mappedRow;
      });
      
      setProgress(85);
      
      // @ts-ignore - jspdf-autotable is not fully typed
      doc.autoTable({
        head: [columns.map(col => col.header)],
        body: tableData.map(row => columns.map(col => row[col.dataKey])),
        startY: 100,
        styles: { overflow: 'linebreak', cellWidth: 'auto' },
        columnStyles: { 
          0: { cellWidth: 80 }, // Date
          1: { cellWidth: 100 }, // Center
          2: { cellWidth: 120 }, // Client
          3: { cellWidth: 80 }, // Amount
          4: { cellWidth: 100 }, // Worker
          5: { cellWidth: 80 }, // Type
          6: { cellWidth: 100 } // Service
        },
        margin: { top: 100 }
      });
      
      setProgress(95);
      doc.save(`GoGain_Transactions_${new Date().toISOString().slice(0, 10)}.pdf`);
      setProgress(100);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export to PDF. Please try again.');
      setProgress(0);
    }
  };

  // Handle export
  const handleExport = async () => {
    setError(null);
    setIsLoading(true);
    setProgress(0);
    
    try {
      // Get filtered transactions
      const transactions = filterTransactions();
      
      if (transactions.length === 0) {
        setError('No transactions found for the selected filters and date range.');
        setIsLoading(false);
        return;
      }
      
      // Prepare data
      const exportData = prepareExportData(transactions);
      
      // Export based on format selection
      if (exportFormat === 'excel') {
        exportToExcel(exportData);
      } else {
        exportToPdf(exportData);
      }
      
      // Close modal after successful export
      setTimeout(() => {
        setIsLoading(false);
        onHide();
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      setError('An error occurred during export. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Export Transactions</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Export Format</Form.Label>
            <div>
              <Form.Check
                inline
                type="radio"
                label="PDF"
                name="exportFormat"
                id="formatPdf"
                checked={exportFormat === 'pdf'}
                onChange={() => setExportFormat('pdf')}
              />
              <Form.Check
                inline
                type="radio"
                label="Excel"
                name="exportFormat"
                id="formatExcel"
                checked={exportFormat === 'excel'}
                onChange={() => setExportFormat('excel')}
              />
            </div>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Transactions to Export</Form.Label>
            <div>
              <Form.Check
                inline
                type="radio"
                label="Currently Filtered Transactions"
                name="exportType"
                id="filteredTransactions"
                checked={exportType === 'filtered'}
                onChange={() => setExportType('filtered')}
              />
              <Form.Check
                inline
                type="radio"
                label="All Transactions (in date range)"
                name="exportType"
                id="allTransactions"
                checked={exportType === 'all'}
                onChange={() => setExportType('all')}
              />
            </div>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Date Range</Form.Label>
            <div className="d-flex">
              <div className="me-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
              <div>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
            </div>
          </Form.Group>
          
          {isLoading && (
            <div className="mt-3">
              <p>Exporting transactions...</p>
              <ProgressBar animated now={progress} label={`${progress}%`} />
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleExport} 
          disabled={isLoading}
          style={{ backgroundColor: "#D95213", borderColor: "#D95213" }}
        >
          {isLoading ? 'Exporting...' : 'Export'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
} 