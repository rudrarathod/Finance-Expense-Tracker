
import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useAppContext } from '../hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';
import { formatCurrency, cn } from '../lib/data';

// Icons
const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const BarChartIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>;
const LineChartIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>;
const TrendingUpIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;


const SpendingTrends = () => {
  const { expenses, currency } = useAppContext();
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [currentDate, setCurrentDate] = useState(new Date());

  const data = useMemo(() => {
    if (view === 'monthly') {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const monthlyExpenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === month && d.getFullYear() === year;
      });

      const dailyTotals = Array.from({ length: daysInMonth }, (_, i) => ({
        name: (i + 1).toString(),
        amount: 0,
      }));

      monthlyExpenses.forEach(exp => {
        const day = new Date(exp.date).getDate() - 1;
        if(day >= 0 && day < daysInMonth) {
            dailyTotals[day].amount += exp.amount;
        }
      });
      return dailyTotals;

    } else { // yearly view
      const year = currentDate.getFullYear();
      const yearlyExpenses = expenses.filter(exp => new Date(exp.date).getFullYear() === year);

      const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
        amount: 0,
      }));

      yearlyExpenses.forEach(exp => {
        const month = new Date(exp.date).getMonth();
        monthlyTotals[month].amount += exp.amount;
      });
      return monthlyTotals;
    }
  }, [expenses, view, currentDate]);

  const changeDate = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (view === 'monthly') {
        newDate.setMonth(prev.getMonth() + offset, 1);
      } else {
        newDate.setFullYear(prev.getFullYear() + offset);
      }
      return newDate;
    });
  };
  
  const isNextDateInFuture = () => {
    const now = new Date();
    const nextDate = new Date(currentDate);
     if (view === 'monthly') {
        nextDate.setMonth(currentDate.getMonth() + 1);
        return nextDate.getFullYear() > now.getFullYear() || (nextDate.getFullYear() === now.getFullYear() && nextDate.getMonth() > now.getMonth());
     } else {
        nextDate.setFullYear(currentDate.getFullYear() + 1);
        return nextDate.getFullYear() > now.getFullYear();
     }
  };

  const periodLabel = view === 'monthly'
    ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    : currentDate.getFullYear().toString();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background/80 border rounded-md shadow-lg backdrop-blur">
          <p className="label font-bold">{`${view === 'monthly' ? `${periodLabel.split(' ')[0]} ` : ''}${label}`}</p>
          <p className="intro text-primary font-semibold">{`Spent: ${formatCurrency(payload[0].value, currency.code)}`}</p>
        </div>
      );
    }
    return null;
  };
  
  if (expenses.length === 0) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Spending Trends</h1>
         <div className="mt-12 flex flex-col items-center justify-center h-[60vh]">
            <TrendingUpIcon className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mt-4">No Data for Trends</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
                Add some expenses, and your spending trends will appear here.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Spending Trends</h1>
      <Card>
        <CardHeader>
          <CardTitle>Spending Overview</CardTitle>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div className="flex items-center justify-between border rounded-lg p-1">
              <Button variant={view === 'monthly' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('monthly')}>Monthly</Button>
              <Button variant={view === 'yearly' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('yearly')}>Yearly</Button>
            </div>
            <div className="flex items-center justify-center">
                <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}><ChevronLeft /></Button>
                <span className="font-semibold text-center w-36">{periodLabel}</span>
                <Button variant="ghost" size="icon" onClick={() => changeDate(1)} disabled={isNextDateInFuture()}><ChevronRight /></Button>
            </div>
             <div className="flex items-center justify-between border rounded-lg p-1">
              <Button variant={chartType === 'bar' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-10" onClick={() => setChartType('bar')}><BarChartIcon className="h-5 w-5"/></Button>
              <Button variant={chartType === 'line' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-10" onClick={() => setChartType('line')}><LineChartIcon className="h-5 w-5"/></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              {chartType === 'bar' ? (
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${currency.symbol}${Number(value) / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `${currency.symbol}${Number(value) / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 8, stroke: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpendingTrends;
