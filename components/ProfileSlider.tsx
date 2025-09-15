import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { cn, CATEGORIES, formatDate, formatCurrency, CURRENCY_LIST, importerService } from '../lib/data';
import { Button, Input, Label, Select, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DatePicker } from './ui';
import { Category, Expense } from '../types';

// Declare global variables for CDN libraries
declare var XLSX: any;

// --- ICONS ---
const SettingsIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.2l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0 2.2l.15.1a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const MonitorIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const SunIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 17.66 1.41-1.41"/><path d="m17.66 4.93 1.41 1.41"/></svg>;
const MoonIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
const ChevronLeftIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>;
const ExportIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const ImportIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const UploadCloudIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>;
const LoaderIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>;

const SettingsView = ({ onBack }: { onBack: () => void }) => {
    const { 
      theme, setTheme, 
      defaultBudget, setDefaultBudget, 
      toast, 
      defaultCategory, setDefaultCategory,
      defaultPaymentMethod, setDefaultPaymentMethod,
      currency, setCurrency,
      clearAllData
    } = useAppContext();

    const [localBudget, setLocalBudget] = useState(defaultBudget.toString());
    const [localCategory, setLocalCategory] = useState(defaultCategory);
    const [localPaymentMethod, setLocalPaymentMethod] = useState(defaultPaymentMethod);
    const [localCurrency, setLocalCurrency] = useState(currency);
    const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
    
    useEffect(() => {
        setLocalCurrency(currency);
    }, [currency]);

    const handleSave = () => {
        const amount = parseFloat(localBudget);
        if (!isNaN(amount) && amount >= 0) {
            setDefaultBudget(amount);
        } else {
            toast('Invalid budget amount entered. Budget not saved.', 'error');
        }
        setDefaultCategory(localCategory);
        setDefaultPaymentMethod(localPaymentMethod);
        setCurrency(localCurrency);
        toast('Settings saved!', 'success');
    };

    const handleConfirmClear = () => {
        clearAllData();
        setIsConfirmClearOpen(false);
    };

    return (
        <>
            <div className="flex items-center p-2 border-b">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
                    <ChevronLeftIcon />
                </Button>
                <h3 className="text-lg font-semibold ml-2">Settings</h3>
            </div>
            <div className="p-4 space-y-8 flex-1 overflow-y-auto">
                <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
                        <Button variant={theme === 'light' ? 'default' : 'ghost'} onClick={() => setTheme('light')} className="flex items-center gap-2"><SunIcon className="h-4 w-4" /> Light</Button>
                        <Button variant={theme === 'dark' ? 'default' : 'ghost'} onClick={() => setTheme('dark')} className="flex items-center gap-2"><MoonIcon className="h-4 w-4" /> Dark</Button>
                        <Button variant={theme === 'system' ? 'default' : 'ghost'} onClick={() => setTheme('system')} className="flex items-center gap-2"><MonitorIcon className="h-4 w-4" /> System</Button>
                    </div>
                </div>

                 <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-md">Currency</h4>
                     <div className="space-y-2">
                        <Label htmlFor="currency">Select Currency</Label>
                        <Select 
                            id="currency"
                            value={JSON.stringify(localCurrency)}
                            onChange={(e) => setLocalCurrency(JSON.parse(e.target.value))}
                        >
                            {CURRENCY_LIST.map(c => (
                                <option key={c.code} value={JSON.stringify({code: c.code, symbol: c.symbol})}>
                                    {c.name} ({c.code}) - {c.symbol}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-md">Defaults</h4>
                    <div className="space-y-2">
                        <Label htmlFor="defaultBudget">Default Monthly Budget</Label>
                        <Input id="defaultBudget" type="number" value={localBudget} onChange={(e) => setLocalBudget(e.target.value)} placeholder="e.g., 2000" />
                        <p className="text-xs text-muted-foreground">Used for months where no specific budget is set.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="defaultCategory">Default Category</Label>
                        <Select id="defaultCategory" value={localCategory} onChange={(e) => setLocalCategory(e.target.value as Category)}>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </Select>
                        <p className="text-xs text-muted-foreground">The default category when adding an expense.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="defaultPaymentMethod">Default Payment Method</Label>
                        <Input id="defaultPaymentMethod" type="text" value={localPaymentMethod} onChange={(e) => setLocalPaymentMethod(e.target.value)} placeholder="e.g., Credit Card" />
                        <p className="text-xs text-muted-foreground">The pre-filled payment method for new expenses.</p>
                    </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-md">Data Management</h4>
                    <div className="space-y-2">
                        <Button variant="destructive" className="w-full" onClick={() => setIsConfirmClearOpen(true)}>Clear All Expense Data</Button>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t">
                 <Button onClick={handleSave} className="w-full">Save Settings</Button>
            </div>

            <Dialog open={isConfirmClearOpen} onClose={() => setIsConfirmClearOpen(false)} aria-labelledby="clear-data-title">
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle id="clear-data-title">Are you sure?</DialogTitle>
                    </DialogHeader>
                    <p className="py-4 text-muted-foreground">
                        This will permanently delete all your expenses and custom monthly budgets. This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmClearOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmClear}>Yes, Clear Data</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

const ExportView = ({ onBack }: { onBack: () => void }) => {
    const { expenses, toast, currency } = useAppContext();
    const [format, setFormat] = useState('json');
    const [filters, setFilters] = useState({
        dateStart: '',
        dateEnd: '',
        category: 'all',
        paymentMethod: 'all',
    });

    const paymentMethods = useMemo(() => {
        const allMethods = expenses
            .map(exp => exp.paymentMethod)
            .filter((pm): pm is string => !!pm && pm.trim() !== '');
        return ['all', ...Array.from(new Set(allMethods))];
    }, [expenses]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDateChange = (name: 'dateStart' | 'dateEnd', date: string) => {
        setFilters(prev => ({ ...prev, [name]: date }));
    };

    const handleExport = () => {
        const filteredExpenses = expenses.filter(exp => {
            const expDate = exp.date.substring(0, 10);
            if (filters.dateStart && expDate < filters.dateStart) return false;
            if (filters.dateEnd && expDate > filters.dateEnd) return false;
            if (filters.category !== 'all' && exp.category !== filters.category) return false;
            if (filters.paymentMethod !== 'all' && exp.paymentMethod !== filters.paymentMethod) return false;
            return true;
        });

        if (filteredExpenses.length === 0) {
            toast('No expenses match the selected filters.', 'error');
            return;
        }

        const fileName = `expensetracker_export_${new Date().toISOString().split('T')[0]}`;

        try {
            if (format === 'json') {
                const dataStr = JSON.stringify(filteredExpenses, null, 2);
                const dataBlob = new Blob([dataStr], { type: "application/json" });
                const dataUrl = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `${fileName}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(dataUrl);
            } else if (format === 'xlsx') {
                const worksheetData = filteredExpenses.map(({ id, receiptImage, ...rest }) => ({
                    Date: formatDate(rest.date, { timeZone: 'UTC' }),
                    Merchant: rest.merchant,
                    Amount: rest.amount,
                    Category: rest.category,
                    'Payment Method': rest.paymentMethod,
                    UTR: rest.utr,
                    Notes: rest.notes,
                }));
                const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
                XLSX.writeFile(workbook, `${fileName}.xlsx`);
            } else if (format === 'pdf') {
                const jspdf = (window as any).jspdf;
                if (!jspdf || !jspdf.jsPDF) {
                    toast('jsPDF library not found.', 'error');
                    return;
                }

                const { jsPDF } = jspdf;
                const doc = new jsPDF();

                // The autoTable plugin attaches itself to the jsPDF instance's prototype.
                // We must check for `doc.autoTable` and call it as a method on the `doc` instance.
                if (typeof doc.autoTable !== 'function') {
                    const errorMsg = "jsPDF autoTable plugin not found or failed to load.";
                    console.error(errorMsg, { doc });
                    toast(errorMsg, 'error');
                    return;
                }

                const tableColumn = ["Date", "Merchant", "Category", "Amount", "Payment Method"];
                const tableRows: (string | number)[][] = [];

                filteredExpenses.forEach(exp => {
                    tableRows.push([
                        formatDate(exp.date, { timeZone: 'UTC' }),
                        exp.merchant,
                        exp.category,
                        formatCurrency(exp.amount, currency.code),
                        exp.paymentMethod || 'N/A'
                    ]);
                });
                
                doc.text("Expense Report", 14, 15);
                doc.autoTable({
                    head: [tableColumn],
                    body: tableRows,
                    startY: 20,
                });
                doc.save(`${fileName}.pdf`);
            }
            toast('Data exported successfully!', 'success');
        } catch (error) {
            console.error("Export failed:", error);
            toast('Failed to export data.', 'error');
        }
    };

    return (
        <>
            <div className="flex items-center p-2 border-b">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10"><ChevronLeftIcon /></Button>
                <h3 className="text-lg font-semibold ml-2">Export Data</h3>
            </div>
            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2">
                    <Label htmlFor="format">Export Format</Label>
                    <Select id="format" name="format" value={format} onChange={(e) => setFormat(e.target.value)}>
                        <option value="json">JSON</option>
                        <option value="xlsx">Excel (XLSX)</option>
                        <option value="pdf">PDF</option>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                         <DatePicker value={filters.dateStart} onChange={(date) => handleDateChange('dateStart', date)} placeholder="Start Date" />
                         <DatePicker value={filters.dateEnd} onChange={(date) => handleDateChange('dateEnd', date)} placeholder="End Date" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select id="category" name="category" value={filters.category} onChange={handleFilterChange}>
                        <option value="all">All Categories</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select id="paymentMethod" name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange}>
                        {paymentMethods.map(pm => <option key={pm} value={pm}>{pm === 'all' ? 'All Payment Methods' : pm}</option>)}
                    </Select>
                </div>
            </div>
            <div className="p-4 border-t">
                <Button onClick={handleExport} className="w-full">Export Data</Button>
            </div>
        </>
    );
};

type ParsedExpenseItem = Partial<Expense> & {
  id: string;
  isDuplicate: boolean;
  isSelected: boolean;
};

const ImportView = ({ onBack }: { onBack: () => void }) => {
  const { expenses, addExpense, toast } = useAppContext();
  const [status, setStatus] = useState<'idle' | 'parsing' | 'review' | 'error' | 'importing'>('idle');
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpenseItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStatus('idle');
    setParsedExpenses([]);
    setError(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const isDuplicate = (item: Partial<Expense>): boolean => {
    if (!item.amount || !item.date || !item.merchant) return false;
    const itemDate = new Date(item.date).toDateString();
    const itemAmount = item.amount;
    const itemMerchant = item.merchant.trim().toLowerCase();

    return expenses.some(exp => 
        new Date(exp.date).toDateString() === itemDate &&
        Math.abs(exp.amount - itemAmount) < 0.01 && // Compare floats carefully
        exp.merchant.trim().toLowerCase() === itemMerchant
    );
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    setStatus('parsing');
    setFileName(file.name);
    try {
      const results = await importerService.processFile(file);
      if (results.length === 0) {
        throw new Error("No valid expense transactions found in the file.");
      }

      const processed = results
        .filter(r => r.amount && r.date && r.merchant && r.amount > 0)
        .map((item, index) => {
            const duplicate = isDuplicate(item);
            return { ...item, id: `${file.name}-${index}`, isDuplicate: duplicate, isSelected: !duplicate };
        });

      setParsedExpenses(processed);
      setStatus('review');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  };
  
  const handleToggleSelect = (id: string) => {
    setParsedExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, isSelected: !exp.isSelected } : exp));
  };

  const handleImport = () => {
    setStatus('importing');
    const toImport = parsedExpenses.filter(exp => exp.isSelected);
    
    toImport.forEach(item => {
        const newExpense: Omit<Expense, 'id'> = {
            amount: item.amount!,
            category: item.category || Category.Other,
            date: item.date!,
            merchant: item.merchant!,
            notes: item.notes || `Imported from ${fileName}`,
            paymentMethod: item.paymentMethod,
            utr: item.utr,
        };
        addExpense(newExpense);
    });

    toast(`Successfully imported ${toImport.length} expenses!`, 'success');
    resetState();
    onBack();
  };

  const selectedCount = useMemo(() => parsedExpenses.filter(e => e.isSelected).length, [parsedExpenses]);

  return (
    <>
      <div className="flex items-center p-2 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10"><ChevronLeftIcon /></Button>
        <h3 className="text-lg font-semibold ml-2">Import Data</h3>
      </div>
      <div className="p-4 flex-1 flex flex-col overflow-y-auto">
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-lg p-6">
            <UploadCloudIcon className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold mt-4">Upload a file</h3>
            <p className="text-muted-foreground mt-1">Import expenses from JSON, CSV, Excel, or PDF files.</p>
            <Button className="mt-6" onClick={() => fileInputRef.current?.click()}>Select File</Button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json,.csv,.xlsx,.xls,.pdf" onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
          </div>
        )}
        {status === 'parsing' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <LoaderIcon className="h-16 w-16 text-primary animate-spin" />
            <h3 className="text-xl font-semibold mt-4">Analyzing File...</h3>
            <p className="text-muted-foreground mt-1 truncate max-w-full px-4">{fileName}</p>
          </div>
        )}
        {status === 'error' && (
           <div className="flex flex-col items-center justify-center h-full text-center">
            <span role="img" aria-label="error" className="text-5xl">😟</span>
            <h3 className="text-xl font-semibold mt-4">Import Failed</h3>
            <p className="text-destructive mt-1 bg-destructive/10 p-3 rounded-md">{error}</p>
            <Button className="mt-6" onClick={resetState}>Try Again</Button>
          </div>
        )}
        {status === 'review' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold">{`Found ${parsedExpenses.length} transactions`}</h4>
                <Button variant="link" onClick={() => setParsedExpenses(p => p.map(i => ({...i, isSelected: true})))}>Select All</Button>
            </div>
            <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                {parsedExpenses.map(item => (
                    <div key={item.id} className="p-3 bg-muted/50 rounded-lg flex items-center space-x-3">
                        <input type="checkbox" checked={item.isSelected} onChange={() => handleToggleSelect(item.id)} className="h-5 w-5 rounded border-border text-primary focus:ring-primary" />
                        <div className="flex-1">
                            <p className="font-semibold">{item.merchant || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{item.date ? formatDate(item.date) : 'Invalid Date'}</p>
                             {item.isDuplicate && <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Potential Duplicate</span>}
                        </div>
                        <p className="font-bold text-primary">{item.amount ? formatCurrency(item.amount) : 'N/A'}</p>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
      {(status === 'review' || status === 'importing') && (
        <div className="p-4 border-t">
          <Button className="w-full" onClick={handleImport} disabled={selectedCount === 0 || status === 'importing'}>
            {status === 'importing' ? <LoaderIcon className="animate-spin" /> : `Import ${selectedCount} Selected Expenses`}
          </Button>
        </div>
      )}
    </>
  );
};


const MainView = ({ onShowSettings, onShowExport, onShowImport }: { onShowSettings: () => void; onShowExport: () => void; onShowImport: () => void }) => {
    return (
        <>
            <div className="flex items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Menu</h3>
            </div>
            <nav className="p-4 space-y-2 flex-1">
                <button onClick={onShowSettings} className="w-full text-left flex items-center p-3 rounded-lg hover:bg-accent transition-colors">
                    <SettingsIcon className="mr-4 text-muted-foreground" />
                    <span className="font-medium">Settings</span>
                </button>
                <button onClick={onShowImport} className="w-full text-left flex items-center p-3 rounded-lg hover:bg-accent transition-colors">
                    <ImportIcon className="mr-4 text-muted-foreground" />
                    <span className="font-medium">Import Data</span>
                </button>
                <button onClick={onShowExport} className="w-full text-left flex items-center p-3 rounded-lg hover:bg-accent transition-colors">
                    <ExportIcon className="mr-4 text-muted-foreground" />
                    <span className="font-medium">Export Data</span>
                </button>
            </nav>
        </>
    );
};

const ProfileSlider = () => {
    const { isProfileSliderOpen, toggleProfileSlider } = useAppContext();
    const [view, setView] = useState('main');

    useEffect(() => {
        // Reset to main view when slider is closed
        if (!isProfileSliderOpen) {
            const timer = setTimeout(() => setView('main'), 300); // Wait for animation
            return () => clearTimeout(timer);
        }
    }, [isProfileSliderOpen]);


    if (!isProfileSliderOpen) return null;

    const renderView = () => {
        switch (view) {
            case 'settings':
                return <SettingsView onBack={() => setView('main')} />;
            case 'export':
                return <ExportView onBack={() => setView('main')} />;
            case 'import':
                return <ImportView onBack={() => setView('main')} />;
            case 'main':
            default:
                return <MainView onShowSettings={() => setView('settings')} onShowExport={() => setView('export')} onShowImport={() => setView('import')} />;
        }
    };

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" onClick={toggleProfileSlider}>
            <div className="absolute inset-0 bg-black/60 animate-in fade-in-0"></div>
            <div
                className={cn(
                    'fixed top-0 right-0 h-full w-full max-w-sm bg-background shadow-lg flex flex-col',
                    'animate-in slide-in-from-right-full duration-300'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {renderView()}
            </div>
        </div>
    );
};

export default ProfileSlider;