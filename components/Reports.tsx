import React, { useState, useMemo, useCallback } from 'react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppContext } from '../hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Skeleton, Progress } from './ui';
import { formatCurrency, cn, aiInsightsService, CATEGORY_DETAILS, formatDate } from '../lib/data';
import { AIReport, Expense, Category } from '../types';

// --- ICONS ---
const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const BarChartIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>;
const LineChartIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>;
const TrendingUpIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const SparklesIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9z"/></svg>;
const ArrowUpIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5l0 14"/><path d="M18 11l-6-6l-6 6"/></svg>;
const ArrowDownIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5l0 14"/><path d="m18 13-6 6-6-6"/></svg>;
const AlertTriangleIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;

// --- TYPES & CONSTANTS ---
type PeriodView = 'monthly' | 'quarterly' | 'yearly';
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF5733'];


// --- HELPER FUNCTIONS ---
const getPeriodRange = (date: Date, view: PeriodView): [Date, Date] => {
  const year = date.getFullYear();
  if (view === 'yearly') {
    return [new Date(year, 0, 1), new Date(year, 11, 31)];
  }
  if (view === 'quarterly') {
    const quarter = Math.floor(date.getMonth() / 3);
    const startMonth = quarter * 3;
    const endMonth = startMonth + 2;
    return [new Date(year, startMonth, 1), new Date(year, endMonth, new Date(year, endMonth + 1, 0).getDate())];
  }
  // monthly
  const month = date.getMonth();
  return [new Date(year, month, 1), new Date(year, month, new Date(year, month + 1, 0).getDate())];
};

const filterExpensesByPeriod = (expenses: Expense[], date: Date, view: PeriodView): Expense[] => {
  const [start, end] = getPeriodRange(date, view);
  return expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate >= start && expDate <= end;
  });
};


const Reports = () => {
  const { expenses, currency, toast, getBudgetForMonth } = useAppContext();
  const [view, setView] = useState<PeriodView>('monthly');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- DATA PROCESSING ---
  const {
    periodLabel,
    currentPeriodExpenses,
    previousPeriodExpenses,
    totalSpent,
    budgetLeftover,
    categoryChanges,
    topCategory,
    trendsData,
    top5Expenses,
    paymentMethodData
  } = useMemo(() => {
    const currentPeriodExpenses = filterExpensesByPeriod(expenses, currentDate, view);
    
    const prevDate = new Date(currentDate);
    if (view === 'monthly') prevDate.setMonth(prevDate.getMonth() - 1);
    else if (view === 'quarterly') prevDate.setMonth(prevDate.getMonth() - 3);
    else prevDate.setFullYear(prevDate.getFullYear() - 1);
    const previousPeriodExpenses = filterExpensesByPeriod(expenses, prevDate, view);

    // High-level stats
    const totalSpent = currentPeriodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const periodBudget = getBudgetForMonth(currentDate); // Note: this is monthly, might need adjustment for quarterly/yearly
    const budgetLeftover = periodBudget - totalSpent;

    // Category breakdown and changes
    const currentCategoryTotals = currentPeriodExpenses.reduce((acc, { category, amount }) => {
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {} as any);
    const previousCategoryTotals = previousPeriodExpenses.reduce((acc, { category, amount }) => {
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {} as any);
    
    const allCategories = [...new Set([...Object.keys(currentCategoryTotals), ...Object.keys(previousCategoryTotals)])];
    const categoryChanges = allCategories.map(cat => {
      const current = currentCategoryTotals[cat] || 0;
      const previous = previousCategoryTotals[cat] || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
      return { category: cat, current, previous, change };
    }).sort((a,b) => b.current - a.current);

    const topCategory = categoryChanges[0]?.category || 'N/A';

    // Chart data
    let trendsData;
    if (view === 'monthly') {
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      trendsData = Array.from({ length: daysInMonth }, (_, i) => ({ name: (i + 1).toString(), amount: 0 }));
      currentPeriodExpenses.forEach(exp => {
        const day = new Date(exp.date).getDate() - 1;
        trendsData[day].amount += exp.amount;
      });
    } else if (view === 'yearly') {
      trendsData = Array.from({ length: 12 }, (_, i) => ({ name: new Date(2000, i, 1).toLocaleString('default', { month: 'short' }), amount: 0 }));
      currentPeriodExpenses.forEach(exp => {
        const month = new Date(exp.date).getMonth();
        trendsData[month].amount += exp.amount;
      });
    } else { // quarterly
        const startMonth = Math.floor(currentDate.getMonth() / 3) * 3;
        trendsData = Array.from({length: 3}, (_, i) => ({name: new Date(2000, startMonth + i, 1).toLocaleString('default', {month: 'long'}), amount: 0}));
        currentPeriodExpenses.forEach(exp => {
            const month = new Date(exp.date).getMonth();
            const index = month - startMonth;
            if(index >= 0 && index < 3) trendsData[index].amount += exp.amount;
        });
    }

    // Top 5 expenses
    const top5Expenses = [...currentPeriodExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Payment method breakdown
    const paymentTotals = currentPeriodExpenses.reduce((acc, { paymentMethod, amount }) => {
        const method = paymentMethod || 'Other';
        acc[method] = (acc[method] || 0) + amount;
        return acc;
    }, {} as any);
    const paymentMethodData = Object.entries(paymentTotals).map(([name, value]) => ({ name, value: value as number}));

    // Period label
    let periodLabel;
    if(view === 'monthly') periodLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    else if(view === 'yearly') periodLabel = currentDate.getFullYear().toString();
    else {
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
        periodLabel = `Q${quarter} ${currentDate.getFullYear()}`;
    }

    return { periodLabel, currentPeriodExpenses, previousPeriodExpenses, totalSpent, budgetLeftover, categoryChanges, topCategory, trendsData, top5Expenses, paymentMethodData };
  }, [expenses, currentDate, view, getBudgetForMonth]);
  

  // --- UI HANDLERS ---
  const changeDate = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (view === 'monthly') newDate.setMonth(prev.getMonth() + offset, 1);
      else if (view === 'quarterly') newDate.setMonth(prev.getMonth() + offset * 3, 1);
      else newDate.setFullYear(prev.getFullYear() + offset);
      return newDate;
    });
  };

  const isNextDateInFuture = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const [_, endDate] = getPeriodRange(currentDate, view);
    return endDate >= now;
  };

  // --- AI ANALYSIS ---
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiReport, setAIReport] = useState<AIReport | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
      setLoadingAI(true);
      setAIReport(null);
      setAIError(null);
      try {
          const result = await aiInsightsService.getAdvancedAnalysis(currentPeriodExpenses, previousPeriodExpenses);
          // FIX: The `result` from `getAdvancedAnalysis` is already a complete, correctly-typed `AIReport`.
          // The previous code was incorrectly trying to overwrite the `spendingChanges` property with
          // a misaligned data structure, causing a type error. Using the result directly is correct.
          setAIReport(result);
      } catch (err) {
          const errorMessage = (err as Error).message;
          setAIError(errorMessage);
          toast(errorMessage, 'error');
      } finally {
          setLoadingAI(false);
      }
  }, [currentPeriodExpenses, previousPeriodExpenses, toast]);
  

  // --- RENDER ---
  if (expenses.length === 0) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Reports</h1>
        <div className="mt-12 flex flex-col items-center justify-center h-[60vh]">
            <TrendingUpIcon className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mt-4">No Data for Reports</h2>
            <p className="text-muted-foreground mt-2 max-w-md">Add expenses to see your trends and insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Reports Dashboard</h1>
      
      {/* Controls */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 flex items-center justify-center border rounded-lg p-1">
              <Button variant={view === 'monthly' ? 'secondary' : 'ghost'} className="flex-1" onClick={() => setView('monthly')}>Monthly</Button>
              <Button variant={view === 'quarterly' ? 'secondary' : 'ghost'} className="flex-1" onClick={() => setView('quarterly')}>Quarterly</Button>
              <Button variant={view === 'yearly' ? 'secondary' : 'ghost'} className="flex-1" onClick={() => setView('yearly')}>Yearly</Button>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}><ChevronLeft /></Button>
                <span className="font-semibold text-center w-40">{periodLabel}</span>
                <Button variant="ghost" size="icon" onClick={() => changeDate(1)} disabled={isNextDateInFuture()}><ChevronRight /></Button>
            </div>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
              <CardHeader><CardTitle>Total Spent</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{formatCurrency(totalSpent, currency.code)}</p></CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>Budget Leftover</CardTitle></CardHeader>
              <CardContent><p className={cn("text-3xl font-bold", budgetLeftover < 0 && "text-destructive")}>{formatCurrency(budgetLeftover, currency.code)}</p></CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle>Top Category</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{topCategory}</p></CardContent>
          </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader><CardTitle>Category Breakdown</CardTitle><CardDescription>Spending compared to previous period.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
            {categoryChanges.filter(c => c.current > 0).map(({category, current, change}) => (
                <div key={category}>
                    <div className="flex justify-between mb-1">
                        <span className="font-medium">{category}</span>
                        <div className="flex items-center space-x-2">
                           <span className={cn("text-sm font-semibold", change > 0 ? "text-red-500" : "text-green-500")}>
                                {change.toFixed(0)}%
                           </span>
                           <span className="font-bold">{formatCurrency(current, currency.code)}</span>
                        </div>
                    </div>
                    <Progress value={(current / totalSpent) * 100} />
                </div>
            ))}
        </CardContent>
      </Card>

      {/* Spending Over Time Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
             <div>
                <CardTitle>Spending Over Time</CardTitle>
                <CardDescription>
                    {view === 'monthly' ? 'Daily' : view === 'quarterly' ? 'Monthly' : 'Monthly'} spending for the period.
                </CardDescription>
             </div>
             <div className="flex items-center border rounded-lg p-1">
              <Button variant={chartType === 'bar' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setChartType('bar')}><BarChartIcon className="h-4 w-4"/></Button>
              <Button variant={chartType === 'line' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setChartType('line')}><LineChartIcon className="h-4 w-4"/></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              {chartType === 'bar' ? (
                <BarChart data={trendsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} tickFormatter={(v) => currency.symbol+v} />
                  <Tooltip cursor={{ fill: 'hsl(var(--accent))' }} content={({ active, payload }) => active && payload?.length ? <div className="p-2 bg-background/80 border rounded-md shadow-lg"><p className="font-semibold">{formatCurrency(payload[0].value as number, currency.code)}</p></div> : null} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={trendsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} tickFormatter={(v) => currency.symbol+v} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="p-2 bg-background/80 border rounded-md shadow-lg"><p className="font-semibold">{formatCurrency(payload[0].value as number, currency.code)}</p></div> : null} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 8 }}/>
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
          {/* Top Expenses */}
          <Card>
              <CardHeader><CardTitle>Top Transactions</CardTitle></CardHeader>
              <CardContent>
                  <ul className="space-y-3">
                      {top5Expenses.map(exp => (
                          <li key={exp.id} className="flex justify-between items-center">
                              <div className="truncate">
                                  <p className="font-medium truncate">{exp.merchant}</p>
                                  <p className="text-sm text-muted-foreground">{formatDate(exp.date)}</p>
                              </div>
                              <p className="font-bold text-lg">{formatCurrency(exp.amount, currency.code)}</p>
                          </li>
                      ))}
                  </ul>
              </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
              <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
              <CardContent style={{width: '100%', height: 250}}>
                  <ResponsiveContainer>
                      <PieChart>
                          <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => entry.name}>
                              {paymentMethodData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value, currency.code)} />
                      </PieChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
      </div>

      {/* Smart Analysis */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><SparklesIcon /> Smart Analysis</CardTitle></CardHeader>
        <CardContent>
            {loadingAI && <div className="text-center"><p className="animate-pulse">AI is analyzing your data...</p></div>}
            {aiError && <div className="text-center text-destructive">{aiError}</div>}
            {!loadingAI && !aiReport && (
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Get AI-powered insights on your spending habits, recurring expenses, and anomalies.</p>
                    <Button onClick={handleAnalyze}>Generate Smart Report</Button>
                </div>
            )}
            {aiReport && (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold mb-2">AI Summary</h4>
                        <p className="text-muted-foreground italic p-3 bg-muted/50 rounded-lg">{aiReport.summary}</p>
                    </div>

                    {aiReport.recurringExpenses.length > 0 && (
                        <div>
                            <h4 className="font-bold mb-2">Potential Recurring Expenses</h4>
                            <ul className="space-y-2">
                                {aiReport.recurringExpenses.map((exp, i) => (
                                    <li key={i} className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                                        <p className="font-medium">{exp.merchant}</p>
                                        <p className="font-bold">{formatCurrency(exp.amount, currency.code)}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                     {aiReport.anomalies.length > 0 && (
                        <div>
                            <h4 className="font-bold mb-2">Spending Anomalies</h4>
                             <ul className="space-y-3">
                                {aiReport.anomalies.map((anom, i) => (
                                    <li key={i} className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-r-lg flex items-start space-x-4">
                                        <AlertTriangleIcon className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-destructive/90 pr-4">{anom.description}</p>
                                                <p className="font-bold text-destructive text-lg whitespace-nowrap">{formatCurrency(anom.amount, currency.code)}</p>
                                            </div>
                                            <p className="text-sm text-destructive/80 mt-1">{formatDate(anom.date)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>
            )}
        </CardContent>
      </Card>

    </div>
  );
};

export default Reports;