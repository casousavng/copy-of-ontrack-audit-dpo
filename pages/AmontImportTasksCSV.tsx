import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { api } from '../services/api';
import { VisitType } from '../types';

interface CSVRow {
  tipo: string; // Auditoria|Formacao|Acompanhamento|Outros
  titulo: string;
  texto: string;
  data: string; // DD/MM/YYYY
  dot_email: string;
  lojas: string; // comma-separated store codes
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export const AmontImportTasksCSV: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importResults, setImportResults] = useState<{ created: number; errors: number }>({ created: 0, errors: 0 });
  const [serverErrors, setServerErrors] = useState<{ line: number; message: string }[]>([]);

  const downloadErrorsCsv = () => {
    if (serverErrors.length === 0) return;
    const header = 'line;message\n';
    const rows = serverErrors
      .map(err => `${err.line};"${(err.message || '').replace(/"/g, '""')}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'import_errors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      const dataLines = lines.slice(1);
      const parsed: CSVRow[] = [];
      const errors: ValidationError[] = [];

      dataLines.forEach((line, index) => {
        const row = index + 2;
        const columns = line.split(';').map(col => col.trim());
        if (columns.length < 6) {
          errors.push({ row, field: 'all', message: 'Linha incompleta (faltam colunas)' });
          return;
        }
        const [tipo, titulo, texto, data, dot_email, lojas] = columns;
        if (!tipo || !['Auditoria','Formacao','Acompanhamento','Outros'].includes(tipo)) {
          errors.push({ row, field: 'tipo', message: 'Tipo inválido' });
        }
        if (!data || !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
          errors.push({ row, field: 'data', message: 'Data inválida (use DD/MM/YYYY)' });
        }
        if (!dot_email || !dot_email.includes('@')) {
          errors.push({ row, field: 'dot_email', message: 'Email do DOT inválido' });
        }
        if (!lojas) {
          errors.push({ row, field: 'lojas', message: 'Lista de lojas é obrigatória' });
        }
        parsed.push({ tipo, titulo, texto, data, dot_email, lojas });
      });

      setCsvData(parsed);
      setValidationErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      if (!file) { alert('Selecione um ficheiro CSV'); setImporting(false); return; }
      const result = await api.importVisitasFromFile(file);
      const errors = Array.isArray(result.errors) ? result.errors : [];
      setImportResults({ created: result.imported || 0, errors: errors.length });
      setServerErrors(errors);
      setImportSuccess(true);
      // Só redireciona automaticamente se não houver erros
      if (errors.length === 0) {
        setTimeout(() => navigate('/amont/dashboard'), 2500);
      }
    } catch (e: any) {
      console.error('Import error:', e);
      alert(e?.message || 'Falha na importação.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `tipo;titulo;texto;data;dot_email;lojas\n`+
      `Auditoria;Auditoria Qualidade Q1;Auditoria trimestral;15/01/2026;dot1@mousquetaires.com;LOJ001\n`+
      `Formacao;Formação HACCP;Sessão inicial;20/01/2026;dot1@mousquetaires.com;LOJ001,LOJ002\n`+
      `Acompanhamento;Acompanhamento Pós-Auditoria;Follow-up;25/01/2026;dot2@mousquetaires.com;LOJ004\n`+
      `Outros;Visita Protocolar;Visita de cortesia;30/01/2026;dot3@mousquetaires.com;LOJ007`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_visitas.csv';
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
            <h1 className="text-2xl font-bold text-gray-900">Importar Visitas (CSV)</h1>
          </div>
          <Button onClick={downloadTemplate} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

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
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </div>
          </label>
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Erros de Validação ({validationErrors.length})</h3>
                <ul className="text-sm text-red-800 space-y-1">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <li key={index}>Linha {error.row}, campo "{error.field}": {error.message}</li>
                  ))}
                  {validationErrors.length > 10 && (
                    <li className="font-semibold">... e mais {validationErrors.length - 10} erros</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {importSuccess && (
          <div className={`${serverErrors.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4 mb-6`}>
            <div className="flex items-start">
              <CheckCircle className={`w-5 h-5 ${serverErrors.length > 0 ? 'text-yellow-600' : 'text-green-600'} mr-2 mt-0.5`} />
              <div>
                <h3 className={`font-semibold ${serverErrors.length > 0 ? 'text-yellow-900' : 'text-green-900'} mb-1`}>Importação Concluída!</h3>
                <p className={`text-sm ${serverErrors.length > 0 ? 'text-yellow-800' : 'text-green-800'}`}>{importResults.created} tarefas criadas com sucesso. {importResults.errors > 0 && `${importResults.errors} erros encontrados.`}</p>
                {serverErrors.length === 0 && <p className="text-sm text-green-700 mt-2">A redirecionar para o dashboard...</p>}
              </div>
            </div>
          </div>
        )}

        {/* Server-side import errors */}
        {importSuccess && serverErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Erros na Importação ({serverErrors.length})</h3>
                <ul className="text-sm text-red-800 space-y-1 max-h-48 overflow-y-auto">
                  {serverErrors.slice(0, 50).map((err, idx) => (
                    <li key={idx}>Linha {err.line}: {err.message}</li>
                  ))}
                  {serverErrors.length > 50 && (
                    <li className="font-semibold">... e mais {serverErrors.length - 50} erros</li>
                  )}
                </ul>
              </div>
              <div className="ml-4">
                <Button variant="outline" size="sm" onClick={downloadErrorsCsv}>
                  <Download className="w-4 h-4 mr-2" />
                  Download erros
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={handleImport} disabled={!file || csvData.length === 0 || validationErrors.length > 0 || importing || importSuccess}>
            <FileText className="w-4 h-4 mr-2" />
            {importing ? 'A importar...' : 'Importar Visitas'}
          </Button>
          <Button onClick={() => navigate('/amont/dashboard')} disabled={importing}>
            {importSuccess && serverErrors.length === 0 ? 'Voltar' : (importSuccess && serverErrors.length > 0 ? 'Concluir' : 'Cancelar')}
          </Button>
        </div>
      </main>
    </div>
  );
};
