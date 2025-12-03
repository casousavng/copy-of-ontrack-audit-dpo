import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { AuditStatus, UserRole } from '../types';
import { getCurrentUser } from '../utils/auth';

interface CSVRow {
  auditoria: string;
  data: string;
  dot_email: string;
  lojas: string; // comma-separated store codes
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export const AmontImportCSV: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importResults, setImportResults] = useState<{ created: number; errors: number }>({ created: 0, errors: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
      setImportSuccess(false);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const parsed: CSVRow[] = [];
      const errors: ValidationError[] = [];

      dataLines.forEach((line, index) => {
        const row = index + 2; // +2 because: +1 for 0-index, +1 for header
        const columns = line.split(';').map(col => col.trim());

        if (columns.length < 4) {
          errors.push({ row, field: 'all', message: 'Linha incompleta (faltam colunas)' });
          return;
        }

        const [auditoria, data, dot_email, lojas] = columns;

        // Validate auditoria name
        if (!auditoria) {
          errors.push({ row, field: 'auditoria', message: 'Nome da auditoria é obrigatório' });
        }

        // Validate date format (DD/MM/YYYY)
        if (!data || !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
          errors.push({ row, field: 'data', message: 'Data inválida (use DD/MM/YYYY)' });
        }

        // Validate DOT email
        if (!dot_email || !dot_email.includes('@')) {
          errors.push({ row, field: 'dot_email', message: 'Email do DOT inválido' });
        }

        // Validate stores
        if (!lojas) {
          errors.push({ row, field: 'lojas', message: 'Lista de lojas é obrigatória' });
        }

        parsed.push({ auditoria, data, dot_email, lojas });
      });

      setCsvData(parsed);
      setValidationErrors(errors);
    };
    reader.readAsText(file);
  };

  const validateDOTsExist = async (): Promise<{ valid: boolean; missingDOTs: string[] }> => {
    const users = await db.getUsers();
    const dotEmails = [...new Set(csvData.map(row => row.dot_email))];
    const missingDOTs: string[] = [];

    dotEmails.forEach(email => {
      const user = users.find(u => u.email === email && u.roles.includes(UserRole.DOT));
      if (!user) {
        missingDOTs.push(email);
      }
    });

    return { valid: missingDOTs.length === 0, missingDOTs };
  };

  const handleImport = async () => {
    setImporting(true);

    // Get current user (Amont)
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert('Erro: Utilizador não autenticado');
      setImporting(false);
      return;
    }

    // Validate DOTs exist
    const { valid, missingDOTs } = await validateDOTsExist();
    if (!valid) {
      alert(`Os seguintes DOTs não existem no sistema:\n${missingDOTs.join('\n')}\n\nPor favor, crie os utilizadores DOT primeiro.`);
      setImporting(false);
      return;
    }

    let created = 0;
    let errors = 0;

    try {
      const users = await db.getUsers();
      const allStores = await db.getStores();

      for (const row of csvData) {
        try {
          // Find DOT user
          const dotUser = users.find(u => u.email === row.dot_email && u.roles.includes(UserRole.DOT));
          if (!dotUser) {
            errors++;
            continue;
          }

          // Parse date from DD/MM/YYYY to ISO (normalize to avoid locale issues)
          const [day, month, year] = row.data.split('/');
          const auditDate = new Date(Number(year), Number(month) - 1, Number(day));

          // Parse store codes
          const storeCodes = row.lojas.split(',').map(code => code.trim());

          // For each store in the row, create an audit
          for (const storeCode of storeCodes) {
            const store = allStores.find(s => s.codehex === storeCode);
            
            if (!store) {
              console.warn(`Loja ${storeCode} não encontrada, a ignorar...`);
              continue;
            }

            // Validate DOT permission for this store (store must be assigned to this DOT)
            if (store.dotUserId !== dotUser.id) {
              console.warn(`DOT ${dotUser.email} não é responsável pela loja ${store.codehex}, a ignorar...`);
              errors++;
              continue;
            }

            // Create audit for this store (createdBy = Amont user ID)
            await db.createAudit({
              store_id: store.id,
              user_id: dotUser.id,
              checklist_id: (await db.getChecklist()).id,
              dtstart: auditDate.toISOString(),
              status: AuditStatus.NEW,
              score: undefined,
              createdBy: currentUser.userId, // Marca como criado pelo Amont
            });

            created++;
          }
        } catch (err) {
          console.error('Error importing row:', row, err);
          errors++;
        }
      }

      setImportResults({ created, errors });
      setImportSuccess(true);
      
      // Clear form after 3 seconds and redirect
      setTimeout(() => {
        navigate('/amont/dashboard');
      }, 3000);
    } catch (err) {
      console.error('Import failed:', err);
      alert('Erro ao importar ficheiro. Verifique o formato e tente novamente.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `auditoria;data;dot_email;lojas
Auditoria Q1 2024;15/01/2024;dot1@example.com;LOJ001,LOJ002,LOJ003
Auditoria Q1 2024;15/01/2024;dot2@example.com;LOJ004,LOJ005
Auditoria Q2 2024;10/04/2024;dot1@example.com;LOJ001,LOJ006`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_auditorias.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/amont/dashboard')} className="mr-4 text-gray-600 hover:text-black">
              <ArrowLeft />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Importar Auditorias (CSV)</h1>
          </div>
          <Button onClick={downloadTemplate} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Formato do Ficheiro CSV</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Separador: <code className="bg-blue-100 px-1 rounded">;</code> (ponto e vírgula)</li>
            <li>• Colunas: <code className="bg-blue-100 px-1 rounded">auditoria;data;dot_email;lojas</code></li>
            <li>• Data no formato: <code className="bg-blue-100 px-1 rounded">DD/MM/YYYY</code></li>
            <li>• Lojas separadas por vírgula: <code className="bg-blue-100 px-1 rounded">LOJ001,LOJ002,LOJ003</code></li>
            <li>• O DOT deve existir no sistema antes da importação</li>
          </ul>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block mb-4">
            <div className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="font-medium text-gray-600">
                  {file ? file.name : 'Clique para selecionar ficheiro CSV'}
                </span>
                <span className="text-sm text-gray-500">ou arraste e largue aqui</span>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </label>

          {file && csvData.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Preview dos Dados ({csvData.length} linhas)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Auditoria</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DOT</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lojas</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvData.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap">{row.auditoria}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{row.data}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{row.dot_email}</td>
                        <td className="px-4 py-2">{row.lojas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">... e mais {csvData.length - 5} linhas</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Erros de Validação ({validationErrors.length})</h3>
                <ul className="text-sm text-red-800 space-y-1">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <li key={index}>
                      Linha {error.row}, campo "{error.field}": {error.message}
                    </li>
                  ))}
                  {validationErrors.length > 10 && (
                    <li className="font-semibold">... e mais {validationErrors.length - 10} erros</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {importSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Importação Concluída!</h3>
                <p className="text-sm text-green-800">
                  {importResults.created} auditorias criadas com sucesso.
                  {importResults.errors > 0 && ` ${importResults.errors} erros encontrados.`}
                </p>
                <p className="text-sm text-green-700 mt-2">A redirecionar para o dashboard...</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleImport}
            disabled={!file || csvData.length === 0 || validationErrors.length > 0 || importing || importSuccess}
          >
            <FileText className="w-4 h-4 mr-2" />
            {importing ? 'A importar...' : 'Importar Auditorias'}
          </Button>
          <Button
            onClick={() => navigate('/amont/dashboard')}
            disabled={importing}
          >
            Cancelar
          </Button>
        </div>
      </main>
    </div>
  );
};
