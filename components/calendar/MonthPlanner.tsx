import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Audit, Store } from '../../types';

interface MonthPlannerProps {
  audits: (Audit & { store: Store })[];
  onAuditClick: (auditId: number) => void;
  onDateClick?: (date: Date) => void;
}

export const MonthPlanner: React.FC<MonthPlannerProps> = ({ audits, onAuditClick, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Get all days in the current month
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Monday = 0
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const monthDays = getMonthDays(currentDate);
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setShowMonthPicker(false);
  };

  const goToMonth = (year: number, month: number) => {
    setCurrentDate(new Date(year, month, 1));
    setShowMonthPicker(false);
  };

  // Generate months for quick navigation
  const getAvailableMonths = () => {
    const months = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Show 6 months back and 12 months forward
    for (let offset = -6; offset <= 12; offset++) {
      const date = new Date(currentYear, today.getMonth() + offset, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }),
        isCurrent: date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
      });
    }
    return months;
  };

  // Group audits by date
  const auditsByDate = audits.reduce((acc, audit) => {
    const dateKey = new Date(audit.dtstart).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(audit);
    return acc;
  }, {} as Record<string, (Audit & { store: Store })[]>);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getMonthYearLabel = () => {
    return currentDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  };

  const getStatusColor = (status: number) => {
    switch(status) {
      case 1: return 'bg-blue-500'; // NEW
      case 2: return 'bg-yellow-500'; // IN_PROGRESS
      case 3: return 'bg-purple-500'; // SUBMITTED
      case 4: return 'bg-green-500'; // ENDED
      case 5: return 'bg-gray-500'; // CLOSED
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-200 bg-white relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-mousquetaires" />
            <div>
              <h3 className="font-bold text-gray-900">Planeador Mensal</h3>
              <button 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="text-sm text-mousquetaires capitalize hover:text-mousquetaires-dark font-medium hover:underline transition-all"
              >
                {getMonthYearLabel()} ▼
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-semibold text-white bg-mousquetaires hover:bg-mousquetaires-dark rounded-lg transition-colors shadow-sm"
            >
              Hoje
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Month Picker Dropdown */}
        {showMonthPicker && (
          <div className="absolute z-10 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {getAvailableMonths().map((month, idx) => (
                <button
                  key={idx}
                  onClick={() => goToMonth(month.year, month.month)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                    month.isCurrent
                      ? 'bg-mousquetaires text-white font-semibold'
                      : currentDate.getMonth() === month.month && currentDate.getFullYear() === month.year
                      ? 'bg-gray-200 text-gray-900 font-medium'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, idx) => (
            <div key={idx} className="text-center text-xs font-semibold text-gray-600 uppercase py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dateKey = date.toDateString();
            const dayAudits = auditsByDate[dateKey] || [];
            const isTodayDate = isToday(date);

            return (
              <div
                key={idx}
                className={`aspect-square border rounded-lg p-2 ${
                  isTodayDate
                    ? 'bg-blue-50 border-mousquetaires border-2'
                    : 'bg-white border-gray-200'
                } hover:shadow-md transition-shadow relative group`}
              >
                {/* Day number with add button */}
                <div className="flex items-start justify-between mb-1">
                  <div
                    className={`text-sm font-bold ${
                      isTodayDate ? 'text-mousquetaires' : 'text-gray-900'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  {onDateClick && (
                    <button
                      onClick={() => onDateClick(date)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-mousquetaires/10 rounded"
                      title="Agendar visita"
                    >
                      <Plus size={14} className="text-mousquetaires" />
                    </button>
                  )}
                </div>

                {/* Audits for this day */}
                <div className="space-y-1">
                  {dayAudits.slice(0, 3).map((audit) => (
                    <button
                      key={audit.id}
                      onClick={() => onAuditClick(audit.id)}
                      className="w-full text-left p-1 rounded bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-mousquetaires transition-all group"
                      title={`${audit.store.brand} - ${audit.store.city} às ${new Date(audit.dtstart).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-1 h-6 ${getStatusColor(audit.status)} rounded-full flex-shrink-0`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate group-hover:text-mousquetaires">
                            {audit.store.brand}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="truncate">{new Date(audit.dtstart).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {dayAudits.length > 3 && (
                    <div className="text-xs text-center text-gray-500 font-medium">
                      +{dayAudits.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2">Estados da Auditoria:</div>
            <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Nova</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Em curso</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">Submetida</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Concluída</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2">Tipos de Visita:</div>
            <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-mousquetaires rounded-full"></div>
                <span className="text-gray-600">Auditoria</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-gray-600">Formação</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                <span className="text-gray-600">Acompanhamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span className="text-gray-600">Outros</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
