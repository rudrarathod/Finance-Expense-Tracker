
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Expense, Theme, AppTab, Category } from '../types';
import { storageService } from '../lib/data';
import { DUMMY_EXPENSES } from '../lib/dummyData';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  toast: (message: string, type: 'success' | 'error') => void;
  toasts: Toast[];
  removeToast: (id: number) => void;
  viewedDate: Date;
  setViewedDate: React.Dispatch<React.SetStateAction<Date>>;
  getBudgetForMonth: (date: Date) => number;
  setBudgetForMonth: (date: Date, amount: number) => void;
  isProfileSliderOpen: boolean;
  toggleProfileSlider: () => void;
  defaultBudget: number;
  setDefaultBudget: (amount: number) => void;
  defaultCategory: Category;
  setDefaultCategory: (category: Category) => void;
  defaultPaymentMethod: string;
  setDefaultPaymentMethod: (method: string) => void;
  currency: { code: string; symbol: string };
  setCurrency: (currency: { code: string; symbol: string }) => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Dashboard);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [viewedDate, setViewedDate] = useState(new Date());
  const [monthlyBudgets, setMonthlyBudgets] = useState<{ [key: string]: number }>({});
  const [isProfileSliderOpen, setIsProfileSliderOpen] = useState(false);
  const [defaultBudget, setDefaultBudgetState] = useState<number>(2000);
  const [defaultCategory, setDefaultCategoryState] = useState<Category>(Category.Food);
  const [defaultPaymentMethod, setDefaultPaymentMethodState] = useState<string>('');
  const [currency, setCurrencyState] = useState({ code: 'INR', symbol: '₹' });
  

  useEffect(() => {
    let storedExpenses = storageService.getExpenses();

    // If no expenses are found in storage, populate with dummy data for a better first-run experience.
    if (storedExpenses.length === 0) {
      const initialExpenses = DUMMY_EXPENSES.map((expense, index) => ({
        ...expense,
        id: `exp-${Date.now()}-${index}`,
      }));
      storageService.saveExpenses(initialExpenses);
      storedExpenses = initialExpenses;
    }

    setExpenses(storedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setMonthlyBudgets(storageService.getMonthlyBudgets());
    setDefaultBudgetState(storageService.getDefaultBudget());
    setDefaultCategoryState(storageService.getDefaultCategory());
    setDefaultPaymentMethodState(storageService.getDefaultPaymentMethod());
    setCurrencyState(storageService.getCurrency());
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.classList.add(effectiveTheme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    setExpenses(prevExpenses => {
        // FIX: Define `newExpense` from the provided `expenseData` and add a unique ID.
        // This resolves a reference error where `newExpense` was used without being declared.
        const newExpense: Expense = {
          ...expenseData,
          id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        const updatedExpenses = [newExpense, ...prevExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        storageService.saveExpenses(updatedExpenses);
        return updatedExpenses;
    });
  }, []);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses(prevExpenses => {
        const updatedExpenses = prevExpenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        storageService.saveExpenses(updatedExpenses);
        return updatedExpenses;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prevExpenses => {
        const updatedExpenses = prevExpenses.filter(exp => exp.id !== id);
        storageService.saveExpenses(updatedExpenses);
        return updatedExpenses;
    });
  }, []);

  const toast = useCallback((message: string, type: 'success' | 'error') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getBudgetForMonth = useCallback((date: Date): number => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const key = `${year}-${month}`;
    const budget = monthlyBudgets[key];
    // A budget is considered "set" if it is a valid number.
    // If it's undefined or not a valid number, it means no budget has been explicitly
    // and correctly set for this month, so we return the default.
    if (typeof budget === 'number' && isFinite(budget)) {
        return budget;
    }
    return defaultBudget;
  }, [monthlyBudgets, defaultBudget]);

  const setBudgetForMonth = useCallback((date: Date, amount: number) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const key = `${year}-${month}`;
    const updatedBudgets = { ...monthlyBudgets, [key]: amount };
    setMonthlyBudgets(updatedBudgets);
    storageService.saveMonthlyBudgets(updatedBudgets);
  }, [monthlyBudgets]);

  const toggleProfileSlider = useCallback(() => setIsProfileSliderOpen(prev => !prev), []);
  const setDefaultBudget = useCallback((amount: number) => {
     setDefaultBudgetState(amount);
     storageService.saveDefaultBudget(amount);
  }, []);

  const setDefaultCategory = useCallback((category: Category) => {
    setDefaultCategoryState(category);
    storageService.saveDefaultCategory(category);
  }, []);

  const setDefaultPaymentMethod = useCallback((method: string) => {
    setDefaultPaymentMethodState(method);
    storageService.saveDefaultPaymentMethod(method);
  }, []);

  const setCurrency = useCallback((newCurrency: { code: string; symbol: string }) => {
    const updatedCurrency = { ...newCurrency, code: newCurrency.code.trim().toUpperCase() };
    setCurrencyState(updatedCurrency);
    storageService.saveCurrency(updatedCurrency);
  }, []);

  const clearAllData = useCallback(() => {
    setExpenses([]);
    setMonthlyBudgets({});
    storageService.saveExpenses([]);
    storageService.saveMonthlyBudgets({});
    toast('All expense and budget data has been cleared.', 'success');
  }, [toast]);

  const value = {
    theme,
    setTheme: setThemeState,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    activeTab,
    setActiveTab,
    toast,
    toasts,
    removeToast,
    viewedDate,
    setViewedDate,
    getBudgetForMonth,
    setBudgetForMonth,
    isProfileSliderOpen,
    toggleProfileSlider,
    defaultBudget,
    setDefaultBudget,
    defaultCategory,
    setDefaultCategory,
    defaultPaymentMethod,
    setDefaultPaymentMethod,
    currency,
    setCurrency,
    clearAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};