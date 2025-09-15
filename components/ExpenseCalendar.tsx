import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Button, Card, CardContent, CardHeader } from './ui';
import { cn, formatCurrency, formatDate } from '../lib/data';

const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const CalendarOffIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.7 4.7A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.3-.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M1 1l22 22"/><path d="M21 11.5V6a2 2 0 0 0-2-2h-5.5"/></svg>;

const ExpenseCalendar = () => {
  const { expenses, currency } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const expensesByDate = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      const date = new Date(exp.date).toDateString();
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 };
      }
      acc[date].total += exp.amount;
      acc[date].count += 1;
      return acc;
    }, {} as { [key: string]: { total: number; count: number } });
  }, [expenses]);

  const { yearlyTotal, monthlyTotal, weeks, weeklyTotals } = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const yearlyTotal = expenses
        .filter(e => new Date(e.date).getFullYear() === currentYear)
        .reduce((sum, e) => sum + e.amount, 0);

    const monthlyTotal = expenses
        .filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        })
        .reduce((sum, e) => sum + e.amount, 0);
    
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    
    const days = [];
    let day = new Date(startDate);
    while (days.length < 42) {
      days.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }
    
    const weeks: Date[][] = [];
    const weeklyTotals: number[] = [];
    for (let i = 0; i < days.length; i += 7) {
        const week = days.slice(i, i + 7);
        weeks.push(week);
        const weekTotal = week.reduce((total, day) => {
            const dateKey = day.toDateString();
            const expenseInfo = expensesByDate[dateKey];
            return total + (expenseInfo ? expenseInfo.total : 0);
        }, 0);
        weeklyTotals.push(weekTotal);
    }
    
    return { yearlyTotal, monthlyTotal, weeks, weeklyTotals };
  }, [expenses, currentDate, expensesByDate]);

  const changeMonth = (amount: number) => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
      setSelectedDate(null);
  };

  const isNextMonthInFuture = () => {
    const now = new Date();
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(currentDate.getMonth() + 1);
    return nextMonth.getFullYear() > now.getFullYear() || (nextMonth.getFullYear() === now.getFullYear() && nextMonth.getMonth() > now.getMonth());
  };

  const selectedDayExpenses = selectedDate ? expenses.filter(e => new Date(e.date).toDateString() === selectedDate.toDateString()) : [];
  const selectedDayTotal = selectedDayExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Calendar</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft /></Button>
            <h2 className="text-xl font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
            <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} disabled={isNextMonthInFuture()}><ChevronRight /></Button>
          </div>
           <div className="mt-4 flex justify-around text-center border-t border-b py-3">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-lg font-bold">{formatCurrency(monthlyTotal, currency.code)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Year</p>
              <p className="text-lg font-bold">{formatCurrency(yearlyTotal, currency.code)}</p>
            </div>
          </div>
          <div className="grid grid-cols-8 text-center text-xs text-muted-foreground mt-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            <div className="font-bold">Total</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-1">
             {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-8 gap-1 items-center">
                {week.map((d, dayIndex) => {
                  const dateKey = d.toDateString();
                  const expenseInfo = expensesByDate[dateKey];
                  const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                  const isToday = d.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === d.toDateString();

                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "h-16 flex flex-col items-center justify-start p-1 rounded-md cursor-pointer transition-colors",
                        isCurrentMonth ? 'bg-background' : 'bg-muted/50 text-muted-foreground',
                        isToday && "bg-primary/20",
                        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        "hover:bg-accent"
                      )}
                      onClick={() => { setSelectedDate(d); }}
                    >
                      <span className={cn("font-medium", isToday && "text-primary")}>{d.getDate()}</span>
                      {expenseInfo && isCurrentMonth && (
                        <div className="mt-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                          {formatCurrency(expenseInfo.total, currency.code)}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="h-16 flex flex-col items-center justify-center p-1 rounded-md bg-muted/50">
                  <span className={cn("font-bold text-sm", weeklyTotals[weekIndex] > 0 ? "text-primary" : "text-muted-foreground")}>
                    {weeklyTotals[weekIndex] > 0 ? formatCurrency(weeklyTotals[weekIndex], currency.code) : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">
            Expenses for {formatDate(selectedDate.toISOString())} - {formatCurrency(selectedDayTotal, currency.code)}
          </h3>
          {selectedDayExpenses.length > 0 ? (
            <ul className="space-y-3">
              {selectedDayExpenses.map(exp => (
                <li key={exp.id} className="flex justify-between items-center bg-card p-3 rounded-lg">
                  <div>
                    <p className="font-semibold">{exp.merchant}</p>
                    <p className="text-sm text-muted-foreground">{exp.category}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(exp.amount, currency.code)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
                <div className="inline-block bg-muted text-muted-foreground p-4 rounded-full">
                    <CalendarOffIcon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold mt-4">Nothing Here</h3>
                <p className="text-muted-foreground mt-1">There were no expenses recorded on this day.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseCalendar;
