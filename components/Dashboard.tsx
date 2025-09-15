import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAppContext } from '../hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label } from './ui';
import { Expense, Category, AppTab } from '../types';
import { CATEGORY_DETAILS, formatCurrency, formatDate, cn } from '../lib/data';

// --- ICONS ---
const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const EditIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;


const EditBudgetDialog = ({ isOpen, onClose, date, currentBudget, onSave }: { isOpen: boolean; onClose: () => void; date: Date; currentBudget: number; onSave: (newBudget: number) => void; }) => {
    const [newBudget, setNewBudget] = useState(currentBudget.toString());
    const dialogId = "edit-budget-title";

    React.useEffect(() => {
        setNewBudget(currentBudget.toString());
    }, [currentBudget, isOpen]);

    const handleSave = () => {
        const amount = parseFloat(newBudget);
        if (!isNaN(amount) && amount >= 0) {
            onSave(amount);
            onClose();
        }
    };
    
    return (
        <Dialog open={isOpen} onClose={onClose} aria-labelledby={dialogId}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle id={dialogId}>Edit Budget for {date.toLocaleString('default', { month: 'long', year: 'numeric' })}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="budget">Monthly Budget</Label>
                    <Input id="budget" type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} placeholder="e.g. 2000" />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Budget</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const Dashboard = () => {
  const { expenses, setActiveTab, viewedDate, setViewedDate, getBudgetForMonth, setBudgetForMonth, toast, currency } = useAppContext();
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);

  const {
    totalSpent,
    categoryData,
    monthlySpendingData,
    recentTransactions,
    viewedMonthExpenses
  } = useMemo(() => {
    const currentMonth = viewedDate.getMonth();
    const currentYear = viewedDate.getFullYear();

    const viewedMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });

    const totalSpent = viewedMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const categoryTotals = viewedMonthExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as { [key in Category]: number });

    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
    
    const monthlySpendingData = Array.from({ length: 12 }).map((_, i) => {
        const monthDate = new Date(currentYear, i, 1);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });
        const monthlyTotal = expenses
            .filter(e => new Date(e.date).getMonth() === i && new Date(e.date).getFullYear() === currentYear)
            .reduce((sum, e) => sum + e.amount, 0);
        return { name: monthName, total: monthlyTotal };
    });

    const recentTransactions = viewedMonthExpenses.slice(0, 5);
    
    return { totalSpent, categoryData, monthlySpendingData, recentTransactions, viewedMonthExpenses };
  }, [expenses, viewedDate]);
  
  const monthlyBudget = getBudgetForMonth(viewedDate);
  const isOverspent = totalSpent > monthlyBudget;

  const changeMonth = (offset: number) => {
    setViewedDate(current => {
      const newDate = new Date(current);
      newDate.setMonth(current.getMonth() + offset);
      return newDate;
    });
  };

  const isNextMonthInFuture = () => {
    const now = new Date();
    const nextMonth = new Date(viewedDate);
    nextMonth.setMonth(viewedDate.getMonth() + 1);
    return nextMonth.getFullYear() > now.getFullYear() || (nextMonth.getFullYear() === now.getFullYear() && nextMonth.getMonth() > now.getMonth());
  };

  if (expenses.length === 0) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="mt-12 flex flex-col items-center justify-center h-[60vh]">
            <span className="text-6xl mb-4" role="img" aria-label="waving hand">👋</span>
            <h2 className="text-2xl font-semibold">Welcome to ExpenseTracker!</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
                It looks like your dashboard is empty. Let's get started by adding your first expense.
            </p>
            <Button className="mt-6" onClick={() => setActiveTab(AppTab.AddExpense)}>
                Add First Expense
            </Button>
        </div>
      </div>
    );
  }

  const budgetProgress = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : (totalSpent > 0 ? 100 : 0);
  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF5733'];
  
  const handleSaveBudget = (newBudget: number) => {
    setBudgetForMonth(viewedDate, newBudget);
    toast('Budget updated successfully!', 'success');
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft /></Button>
        <h1 className="text-2xl font-bold tracking-tight text-center">{viewedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h1>
        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} disabled={isNextMonthInFuture()}><ChevronRight /></Button>
      </div>
      
      {viewedMonthExpenses.length === 0 ? (
         <div className="text-center py-16">
            <span className="text-6xl mb-4 block" role="img" aria-label="empty box">📭</span>
            <h3 className="text-2xl font-semibold">No Expenses Found</h3>
            <p className="text-muted-foreground mt-2">There are no expenses recorded for this month.</p>
         </div>
      ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>This Month's Expenses</CardTitle>
              <CardDescription>Total amount spent in {viewedDate.toLocaleString('default', { month: 'long' })}.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={cn("text-4xl font-bold", isOverspent && "text-destructive")}>{formatCurrency(totalSpent, currency.code)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1.5">
                    <CardTitle>Monthly Budget</CardTitle>
                    <CardDescription>
                        {isOverspent 
                            ? <>You've overspent by <span className="font-bold text-destructive">{formatCurrency(totalSpent - monthlyBudget, currency.code)}</span></>
                            : `Your spending vs. budget of ${formatCurrency(monthlyBudget, currency.code)}`
                        }
                    </CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsBudgetDialogOpen(true)}>
                    <EditIcon className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-full h-4 mt-4">
                <div className={cn("h-4 rounded-full", isOverspent ? 'bg-destructive' : 'bg-primary')} style={{ width: `${Math.min(budgetProgress, 100)}%` }}></div>
              </div>
              <p className={cn("text-right mt-2 text-sm", isOverspent ? "text-destructive font-bold" : "text-muted-foreground")}>{budgetProgress.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value, currency.code)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spending in {viewedDate.getFullYear()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                      <BarChart data={monthlySpendingData}>
                          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currency.symbol}${value}`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value, currency.code)} />
                          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest transactions for {viewedDate.toLocaleString('default', { month: 'long' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recentTransactions.map(exp => (
                <li key={exp.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{CATEGORY_DETAILS[exp.category].icon}</div>
                    <div>
                      <p className="font-semibold">{exp.merchant}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(exp.date)}{exp.paymentMethod ? ` • ${exp.paymentMethod}`: ''}</p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(exp.amount, currency.code)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </>
      )}
      <EditBudgetDialog 
        isOpen={isBudgetDialogOpen}
        onClose={() => setIsBudgetDialogOpen(false)}
        date={viewedDate}
        currentBudget={monthlyBudget}
        onSave={handleSaveBudget}
      />
    </div>
  );
};

export default Dashboard;