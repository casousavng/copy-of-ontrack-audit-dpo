import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { Audit, Store } from '../../types';

interface WeekPlannerProps {
  audits: (Audit & { store: Store })[];
  onAuditClick: (auditId: number) => void;
  onDateClick?: (date: Date) => void;
}

export const WeekPlanner: React.FC<WeekPlannerProps> = ({ audits, onAuditClick, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current week dates (Monday to Sunday)
  const getWeekDates = (date: Date) => {
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); // Monday
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      week.push(new Date(day));
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Group audits by date
  const auditsByDate = audits.reduce((acc, audit) => {
    const dateKey = new Date(audit.dtstart).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(audit);
    return acc;
  }, {} as Record<string, (Audit & { store: Store })[]>);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getMonthYearLabel = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    
    if (start.getMonth() === end.getMonth()) {
      return start.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    } else {
      return `${start.toLocaleDateString('pt-PT', { month: 'short' })} - ${end.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}`;
    }
  };

  const getStatusColor = (status: number) => {
    switch(status) {
      case 1: return 'bg-blue-500'; // NEW
      case 2: return 'bg-yellow-500'; // IN_PROGRESS
      case 3: return 'bg-green-500'; // ENDED
      case 4: return 'bg-gray-500'; // CLOSED
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header - unified theme with MonthPlanner */}
      <div className="p-4 border-b-2 border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-mousquetaires" />
            <div>
              <h3 className="font-bold text-gray-900">Planeador Semanal</h3>
              <p className="text-xs text-gray-600 capitalize">{getMonthYearLabel()}</p>
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
              onClick={goToPreviousWeek}
              className="p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-gray-200">
        {weekDates.map((date, idx) => {
          const dateKey = date.toDateString();
          const dayAudits = auditsByDate[dateKey] || [];
          const isTodayDate = isToday(date);

          return (
            <div
              key={idx}
              className={`min-h-[180px] p-3 ${isTodayDate ? 'bg-blue-50' : 'bg-white'}`}
            >
              {/* Day Header */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  {weekDays[idx]}
                </div>
                <div
                  className={`text-lg font-bold mt-1 ${
                    isTodayDate
                      ? 'text-mousquetaires'
                      : 'text-gray-900'
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>

              {/* Audits for this day */}
              <div className="space-y-2">
                {dayAudits.length === 0 ? (
                  <div className="text-xs text-gray-400 italic">Sem visitas</div>
                ) : (
                  dayAudits.map((audit) => (
                    <button
                      key={audit.id}
                      onClick={() => onAuditClick(audit.id)}
                      className="w-full text-left p-2 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-mousquetaires hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-1 h-full ${getStatusColor(audit.status)} rounded-full flex-shrink-0 mt-1`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate group-hover:text-mousquetaires">
                            {audit.store.brand}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <MapPin size={10} className="flex-shrink-0" />
                            <span className="truncate">{audit.store.city}</span>
                          </div>
                          <div className="text-xs font-medium text-gray-700 mt-1">
                            {new Date(audit.dtstart).toLocaleTimeString('pt-PT', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Add visit button */}
              {onDateClick && (
                <button
                  onClick={() => onDateClick(date)}
                  className="w-full mt-2 text-xs text-center py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:border-mousquetaires hover:text-mousquetaires hover:bg-mousquetaires/5 transition-all"
                >
                  + Agendar
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2">Estados da Auditoria:</div>
            <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Não iniciada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Em curso</span>
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
