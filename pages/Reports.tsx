import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { ScoreGauge } from '../components/charts/ScoreGauge';
import { 
  ArrowLeft, Download, TrendingUp, TrendingDown, 
  BarChart3, PieChart, Calendar, Award 
} from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus, Store } from '../types';

interface BrandStats {
  brand: string;
  total: number;
  avgScore: number;
  completed: number;
}

interface MonthlyStats {
  month: string;
  audits: number;
  avgScore: number;
}

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<(Audit & { store: Store })[]>([]);
  const [brandStats, setBrandStats] = useState<BrandStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stores = db.getStores();
    const users = db.getUsers();
    
    const allAudits: (Audit & { store: Store })[] = [];
    users.forEach(user => {
      const userAudits = db.getAudits(user.id);
      userAudits.forEach(audit => {
        const store = stores.find(s => s.id === audit.store_id);
        if (store) {
          allAudits.push({ ...audit, store });
        }
      });
    });

    setAudits(allAudits);
    calculateBrandStats(allAudits);
    calculateMonthlyStats(allAudits);
    setLoading(false);
  }, []);

  const calculateBrandStats = (audits: (Audit & { store: Store })[]) => {
    const brandMap = new Map<string, { total: number; scores: number[]; completed: number }>();
    
    audits.forEach(audit => {
      const brand = audit.store.brand;
      if (!brandMap.has(brand)) {
        brandMap.set(brand, { total: 0, scores: [], completed: 0 });
      }
      const data = brandMap.get(brand)!;
      data.total++;
      if (audit.score !== undefined) {
        data.scores.push(audit.score);
      }
      if (audit.status >= AuditStatus.ENDED) {
        data.completed++;
      }
    });

    const stats: BrandStats[] = Array.from(brandMap.entries()).map(([brand, data]) => ({
      brand,
      total: data.total,
      avgScore: data.scores.length > 0 
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length 
        : 0,
      completed: data.completed
    }));

    setBrandStats(stats.sort((a, b) => b.avgScore - a.avgScore));
  };

  const calculateMonthlyStats = (audits: (Audit & { store: Store })[]) => {
    const monthMap = new Map<string, { audits: number; scores: number[] }>();
    
    audits.forEach(audit => {
      const date = new Date(audit.dtstart);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { audits: 0, scores: [] });
      }
      const data = monthMap.get(monthKey)!;
      data.audits++;
      if (audit.score !== undefined) {
        data.scores.push(audit.score);
      }
    });

    const stats: MonthlyStats[] = Array.from(monthMap.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return {
          month: date.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }),
          audits: data.audits,
          avgScore: data.scores.length > 0 
            ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length 
            : 0
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    setMonthlyStats(stats);
  };

  const handleExport = () => {
    const csvContent = [
      ['Marca', 'Total Visitas', 'Pontuação Média', 'Concluídas'].join(','),
      ...brandStats.map(stat => 
        [stat.brand, stat.total, stat.avgScore.toFixed(1), stat.completed].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-ontrack-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const overallStats = {
    total: audits.length,
    completed: audits.filter(a => a.status >= AuditStatus.ENDED).length,
    avgScore: audits.filter(a => a.score !== undefined).length > 0
      ? audits.filter(a => a.score !== undefined).reduce((sum, a) => sum + (a.score || 0), 0) / 
        audits.filter(a => a.score !== undefined).length
      : 0,
    bestScore: Math.max(...audits.filter(a => a.score !== undefined).map(a => a.score || 0), 0),
    worstScore: Math.min(...audits.filter(a => a.score !== undefined).map(a => a.score || 100), 100),
  };

  const completionRate = overallStats.total > 0 
    ? (overallStats.completed / overallStats.total) * 100 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-500">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/amont/dashboard')}
              className="mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios e Analytics</h1>
            <p className="text-gray-500">Análise detalhada das visitas de auditoria</p>
          </div>
          <Button onClick={handleExport}>
            <Download size={16} className="mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="text-blue-500" size={32} />
              <span className="text-xs text-gray-500">TOTAL</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {overallStats.total}
            </div>
            <div className="text-sm text-gray-500">Visitas Realizadas</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="text-green-500" size={32} />
              <span className="text-xs text-gray-500">MÉDIA</span>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {overallStats.avgScore.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Pontuação Média</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-emerald-500" size={32} />
              <span className="text-xs text-gray-500">MELHOR</span>
            </div>
            <div className="text-3xl font-bold text-emerald-600 mb-1">
              {overallStats.bestScore.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500">Melhor Pontuação</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="text-red-500" size={32} />
              <span className="text-xs text-gray-500">PIOR</span>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">
              {overallStats.worstScore.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500">Pior Pontuação</div>
          </div>
        </div>

        {/* Main Gauge */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pontuação Média Global</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>Todos os períodos</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ScoreGauge score={overallStats.avgScore} size={300} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-200 pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {overallStats.completed}
              </div>
              <div className="text-sm text-gray-500">Visitas Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {completionRate.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500">Taxa de Conclusão</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Brand Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">
                Desempenho por Marca
              </h3>
            </div>
            <div className="space-y-4">
              {brandStats.map((stat, idx) => {
                const maxScore = Math.max(...brandStats.map(s => s.avgScore));
                const barWidth = (stat.avgScore / maxScore) * 100;
                
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{stat.brand}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{stat.total} visitas</span>
                        <span className={`font-semibold ${
                          stat.avgScore >= 80 ? 'text-green-600' :
                          stat.avgScore >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {stat.avgScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          stat.avgScore >= 80 ? 'bg-green-500' :
                          stat.avgScore >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">
                Tendência Mensal
              </h3>
            </div>
            <div className="space-y-4">
              {monthlyStats.map((stat, idx) => {
                const maxAudits = Math.max(...monthlyStats.map(s => s.audits));
                const barWidth = (stat.audits / maxAudits) * 100;
                
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{stat.month}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{stat.audits} visitas</span>
                        <span className={`font-semibold ${
                          stat.avgScore >= 80 ? 'text-green-600' :
                          stat.avgScore >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {stat.avgScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Top/Bottom Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Performers */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-green-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">
                Top 3 Melhores Lojas
              </h3>
            </div>
            <div className="space-y-3">
              {audits
                .filter(a => a.score !== undefined)
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .slice(0, 3)
                .map((audit, idx) => (
                  <div
                    key={audit.id}
                    className="bg-white rounded-lg p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/amont/audit/${audit.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0 ? 'bg-yellow-500' :
                        idx === 1 ? 'bg-gray-400' :
                        'bg-orange-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {audit.store.brand}
                        </div>
                        <div className="text-sm text-gray-500">
                          {audit.store.city} - {audit.store.codehex}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {audit.score?.toFixed(0)}%
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Bottom Performers */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-sm border border-red-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="text-red-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">
                Lojas com Atenção Necessária
              </h3>
            </div>
            <div className="space-y-3">
              {audits
                .filter(a => a.score !== undefined)
                .sort((a, b) => (a.score || 0) - (b.score || 0))
                .slice(0, 3)
                .map((audit) => (
                  <div
                    key={audit.id}
                    className="bg-white rounded-lg p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/amont/audit/${audit.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-red-500">
                        !
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {audit.store.brand}
                        </div>
                        <div className="text-sm text-gray-500">
                          {audit.store.city} - {audit.store.codehex}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {audit.score?.toFixed(0)}%
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
