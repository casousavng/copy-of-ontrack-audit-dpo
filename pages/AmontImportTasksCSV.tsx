import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { AuditStatus, UserRole, VisitType } from '../types';
import { getCurrentUser } from '../utils/auth';

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
    setImporting(true);
    const currentUser = getCurrentUser();
    if (!currentUser) { alert('Erro: Utilizador não autenticado'); setImporting(false); return; }
    let created = 0, errors = 0;
    try {
      const users = db.getUsers();
      const allStores = db.getStores();
      for (const row of csvData) {
        const dotUser = users.find(u => u.email === row.dot_email && u.roles.includes(UserRole.DOT));
        if (!dotUser) { errors++; continue; }
        const [day, month, year] = row.data.split('/');
        const dt = new Date(Number(year), Number(month) - 1, Number(day));
        const storeCodes = row.lojas.split(',').map(code => code.trim());
        for (const code of storeCodes) {
          const store = allStores.find(s => s.codehex === code);
          if (!store) { errors++; continue; }
          if (store.dotUserId !== dotUser.id) { errors++; continue; }
          const typeMap: Record<string, VisitType> = {
            'Auditoria': VisitType.AUDITORIA,
            'Formacao': VisitType.FORMACAO,
            'Acompanhamento': VisitType.ACOMPANHAMENTO,
            'Outros': VisitType.OUTROS
          };
          const vtype = typeMap[row.tipo];
          if (vtype === VisitType.AUDITORIA) {
            // create as audit using existing checklist
            db.createAudit({
              store_id: store.id,
              user_id: dotUser.id,
              checklist_id: db.getChecklist().id,
              dtstart: dt.toISOString(),
              status: AuditStatus.NEW,
              createdBy: currentUser.userId,
            });
          } else {
            // create simple visit
            db.createVisit({
              type: vtype,
              title: row.titulo || `${row.tipo} ${code}`,
              text: row.texto || '',
              user_id: dotUser.id,
              store_id: store.id,
              dtstart: dt.toISOString(),
              status: AuditStatus.NEW,
              createdBy: currentUser.userId
            });
          }
          created++;
        }
      }
      setImportResults({ created, errors });
      setImportSuccess(true);
      setTimeout(() => navigate('/amont/dashboard'), 3000);
    } catch (e) {
      console.error(e);
      alert('Falha na importação.');
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Importação Concluída!</h3>
                <p className="text-sm text-green-800">{importResults.created} tarefas criadas com sucesso. {importResults.errors > 0 && `${importResults.errors} erros encontrados.`}</p>
                <p className="text-sm text-green-700 mt-2">A redirecionar para o dashboard...</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={handleImport} disabled={!file || csvData.length === 0 || validationErrors.length > 0 || importing || importSuccess}>
            <FileText className="w-4 h-4 mr-2" />
            {importing ? 'A importar...' : 'Importar Visitas'}
          </Button>
          <Button onClick={() => navigate('/amont/dashboard')} disabled={importing}>Cancelar</Button>
        </div>
      </main>
    </div>
  );
};
