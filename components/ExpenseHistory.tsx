import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Expense, Category, AppTab } from '../types';
import { Input, Select, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Textarea, Label, DatePicker } from './ui';
import { CATEGORY_DETAILS, cn, formatCurrency, formatDate, CATEGORIES } from '../lib/data';

const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
// FIX: Corrected the malformed SVG attributes which were causing parsing errors.
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const SearchXIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="13" y1="9" x2="9" y2="13"></line><line x1="9" y1="9" x2="13" y2="13"></line></svg>;

const ACTION_WIDTH = 80; // Width of the revealed action buttons in pixels

const ExpenseCard = ({ expense, onEdit, onDelete, currencyCode }: { expense: Expense; onEdit: (exp: Expense) => void; onDelete: (id: string) => void; currencyCode: string; }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const pointerStartX = useRef(0);
    const currentOffsetX = useRef(0);
    const isDragging = useRef(false);
    const wasDragged = useRef(false); // Ref to distinguish swipe from tap

    const snapToPosition = (position: number) => {
        if (cardRef.current) {
            cardRef.current.style.transition = 'transform 0.2s ease-out';
            cardRef.current.style.transform = `translateX(${position}px)`;
            currentOffsetX.current = position;
        }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return; // Only allow primary clicks
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        pointerStartX.current = e.clientX;
        isDragging.current = true;
        wasDragged.current = false;
        if (cardRef.current) {
            cardRef.current.style.transition = 'none';
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        const pointerCurrentX = e.clientX;
        const diffX = pointerCurrentX - pointerStartX.current;
        
        if (Math.abs(diffX) > 5) {
            wasDragged.current = true;
        }

        let newOffsetX = currentOffsetX.current + diffX;
        newOffsetX = Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, newOffsetX));
        
        if (cardRef.current) {
            cardRef.current.style.transform = `translateX(${newOffsetX}px)`;
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        isDragging.current = false;
        
        if (wasDragged.current) {
            const pointerEndX = e.clientX;
            const diffX = pointerEndX - pointerStartX.current;
            const finalOffsetX = currentOffsetX.current + diffX;
            if (finalOffsetX < -ACTION_WIDTH / 1.5) {
                snapToPosition(-ACTION_WIDTH); // Snap left to reveal delete
            } else if (finalOffsetX > ACTION_WIDTH / 1.5) {
                snapToPosition(ACTION_WIDTH); // Snap right to reveal edit
            } else {
                snapToPosition(0); // Snap back to center
            }
        }
    };

    const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        isDragging.current = false;
        snapToPosition(0);
    };
    
    const handleEditClick = (e: React.PointerEvent) => {
        e.stopPropagation();
        onEdit(expense);
        snapToPosition(0);
    };

    const handleDeleteClick = (e: React.PointerEvent) => {
        e.stopPropagation();
        onDelete(expense.id);
    };

    const handleCardClick = () => {
        if (wasDragged.current) return;
        if (currentOffsetX.current !== 0) {
            snapToPosition(0);
        }
    };

    return (
        <li className="relative bg-card rounded-lg overflow-hidden">
            {/* Background actions container */}
            <div className="absolute inset-0 flex justify-between">
                <button
                    onPointerUp={handleEditClick}
                    className="w-20 bg-blue-500 text-white flex items-center justify-center"
                    aria-label={`Edit ${expense.merchant}`}
                >
                    <EditIcon />
                </button>
                <button
                    onPointerUp={handleDeleteClick}
                    className="w-20 bg-destructive text-destructive-foreground flex items-center justify-center"
                    aria-label={`Delete ${expense.merchant}`}
                >
                    <TrashIcon />
                </button>
            </div>

            {/* Draggable card content */}
            <div
                ref={cardRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onClick={handleCardClick}
                className="p-4 border-b border-border bg-card relative z-10 flex items-center space-x-4 cursor-pointer"
                style={{ touchAction: 'pan-y' }} // Allows vertical scroll while capturing horizontal swipe
            >
                <div className="text-3xl p-2 bg-muted rounded-full">{CATEGORY_DETAILS[expense.category].icon}</div>
                <div className="flex-1">
                    <p className="font-bold">{expense.merchant}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(expense.date)}{expense.paymentMethod ? ` • ${expense.paymentMethod}`: ''}</p>
                    {expense.notes && <p className="text-xs italic text-muted-foreground mt-1">{expense.notes}</p>}
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(expense.amount, currencyCode)}</p>
                    <p className="text-sm text-muted-foreground">{expense.category}</p>
                </div>
            </div>
        </li>
    );
};


const EditExpenseDialog = ({ expense, isOpen, onClose, onSave }: { expense: Expense | null; isOpen: boolean; onClose: () => void; onSave: (exp: Expense) => void;}) => {
    const [editedExpense, setEditedExpense] = useState<Expense | null>(expense);
    const dialogId = "edit-expense-title";

    React.useEffect(() => {
        setEditedExpense(expense);
    }, [expense]);

    if (!isOpen || !editedExpense) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedExpense(prev => prev ? { ...prev, [name]: value } : null);
    };
    
    const handleSave = () => {
        if(editedExpense) {
            onSave({...editedExpense, amount: Number(editedExpense.amount)});
        }
    }

    return (
        <Dialog open={isOpen} onClose={onClose} aria-labelledby={dialogId}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle id={dialogId}>Edit Expense</DialogTitle>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <Input name="amount" type="number" value={editedExpense.amount} onChange={handleChange} placeholder="Amount" />
                    <Select name="category" value={editedExpense.category} onChange={handleChange}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                    <Input name="date" type="date" value={new Date(editedExpense.date).toISOString().split('T')[0]} onChange={handleChange} />
                    <Input name="merchant" value={editedExpense.merchant} onChange={handleChange} placeholder="Merchant" />
                    <Input name="paymentMethod" value={editedExpense.paymentMethod || ''} onChange={handleChange} placeholder="Payment Method" />
                    <Input name="utr" value={editedExpense.utr || ''} onChange={handleChange} placeholder="UTR / Transaction ID" />
                    <Textarea name="notes" value={editedExpense.notes} onChange={handleChange} placeholder="Notes" />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface Filters {
  dateStart: string;
  dateEnd: string;
  amountMin: string;
  amountMax: string;
  paymentMethod: string;
}

const FilterDialog = ({ isOpen, onClose, onApply, onClear, currentFilters, paymentMethods }: { isOpen: boolean; onClose: () => void; onApply: (filters: Filters) => void; onClear: () => void; currentFilters: Filters; paymentMethods: string[] }) => {
    const [tempFilters, setTempFilters] = useState<Filters>(currentFilters);
    const dialogId = "filter-expenses-title";
    
    React.useEffect(() => {
        setTempFilters(currentFilters);
    }, [currentFilters, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setTempFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDateChange = (name: 'dateStart' | 'dateEnd', date: string) => {
        setTempFilters(prev => ({ ...prev, [name]: date }));
    };
    
    const handleApply = () => {
        onApply(tempFilters);
        onClose();
    };

    const handleClear = () => {
        onClear();
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} aria-labelledby={dialogId}>
            <DialogContent>
                <DialogHeader><DialogTitle id={dialogId}>Filter Expenses</DialogTitle></DialogHeader>
                <div className="py-4 grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label>Start Date</Label>
                        <DatePicker
                            value={tempFilters.dateStart}
                            onChange={(date) => handleDateChange('dateStart', date)}
                            placeholder="Select start date"
                        />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label>End Date</Label>
                        <DatePicker
                            value={tempFilters.dateEnd}
                            onChange={(date) => handleDateChange('dateEnd', date)}
                            placeholder="Select end date"
                        />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor="amountMin">Min Amount</Label>
                        <Input id="amountMin" name="amountMin" type="number" placeholder="0.00" value={tempFilters.amountMin} onChange={handleChange} />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor="amountMax">Max Amount</Label>
                        <Input id="amountMax" name="amountMax" type="number" placeholder="1000.00" value={tempFilters.amountMax} onChange={handleChange} />
                    </div>
                     <div className="space-y-2 col-span-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select id="paymentMethod" name="paymentMethod" value={tempFilters.paymentMethod} onChange={handleChange}>
                            {paymentMethods.map(pm => <option key={pm} value={pm}>{pm === 'all' ? 'All Payment Methods' : pm}</option>)}
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={handleClear}>Clear Filters</Button>
                    <div className="flex-1" />
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleApply}>Apply Filters</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const ExpenseHistory = () => {
    const { expenses, deleteExpense, updateExpense, toast, setActiveTab, currency } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('date-desc');
    const [isEditing, setIsEditing] = useState<Expense | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [expenseIdToDelete, setExpenseIdToDelete] = useState<string | null>(null);
    
    const initialFilterState: Filters = { dateStart: '', dateEnd: '', amountMin: '', amountMax: '', paymentMethod: 'all' };
    const [filters, setFilters] = useState<Filters>(initialFilterState);

    const paymentMethods = useMemo(() => {
        const allMethods = expenses
            .map(exp => exp.paymentMethod)
            .filter((pm): pm is string => !!pm && pm.trim() !== '');
        return ['all', ...Array.from(new Set(allMethods))];
    }, [expenses]);
    
    const activeFilterCount = useMemo(() => {
        return Object.entries(filters).reduce((count, [key, value]) => {
            if (key === 'paymentMethod' && value !== 'all') return count + 1;
            if (key !== 'paymentMethod' && value) return count + 1;
            return count;
        }, 0);
    }, [filters]);

    const filteredAndSortedExpenses = useMemo(() => {
        let result = expenses.filter(exp => {
            // Search term filter
            const searchTermMatch = searchTerm === '' ||
                exp.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.notes.toLowerCase().includes(searchTerm.toLowerCase());
            if (!searchTermMatch) return false;

            // Payment method filter
            if (filters.paymentMethod !== 'all' && exp.paymentMethod !== filters.paymentMethod) return false;
            
            // Amount range filter
            const amount = exp.amount;
            const minAmount = parseFloat(filters.amountMin);
            const maxAmount = parseFloat(filters.amountMax);
            if (!isNaN(minAmount) && amount < minAmount) return false;
            if (!isNaN(maxAmount) && amount > maxAmount) return false;
            
            // Date range filter (string comparison on 'YYYY-MM-DD' format is safe and avoids timezone issues)
            const expDateOnly = exp.date.substring(0, 10);
            if (filters.dateStart && expDateOnly < filters.dateStart) return false;
            if (filters.dateEnd && expDateOnly > filters.dateEnd) return false;

            return true;
        });

        result.sort((a, b) => {
            switch (sortOrder) {
                case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'amount-desc': return b.amount - a.amount;
                case 'amount-asc': return a.amount - b.amount;
                default: return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });

        return result;
    }, [expenses, searchTerm, sortOrder, filters]);

    if (expenses.length === 0) {
        return (
            <div className="p-4 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-6">Expense History</h1>
                <div className="mt-12 flex flex-col items-center justify-center h-[60vh]">
                    <span className="text-6xl mb-4" role="img" aria-label="page with curl">📃</span>
                    <h2 className="text-2xl font-semibold">Your history is clear!</h2>
                    <p className="text-muted-foreground mt-2 max-w-md">
                        Once you add expenses, they will appear here for you to review and manage.
                    </p>
                    <Button className="mt-6" onClick={() => setActiveTab(AppTab.AddExpense)}>
                        Add an Expense
                    </Button>
                </div>
            </div>
        );
    }
    
    const handleEdit = (expense: Expense) => {
        setIsEditing(expense);
    };

    const handleDelete = (id: string) => {
        setExpenseIdToDelete(id);
    };
    
    const confirmDelete = () => {
        if (expenseIdToDelete) {
            deleteExpense(expenseIdToDelete);
            toast('Expense deleted!', 'success');
            setExpenseIdToDelete(null);
        }
    };
    
    const handleSaveEdit = (editedExpense: Expense) => {
        updateExpense(editedExpense);
        toast('Expense updated!', 'success');
        setIsEditing(null);
    }

    const handleClearFilters = () => setFilters(initialFilterState);

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Expense History</h1>
            
            <div className="space-y-4 mb-6">
                <Input
                    type="text"
                    placeholder="Search expenses by merchant or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex gap-4">
                     <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="flex-1">
                        <option value="date-desc">Sort: Date (Newest)</option>
                        <option value="date-asc">Sort: Date (Oldest)</option>
                        <option value="amount-desc">Sort: Amount (High-Low)</option>
                        <option value="amount-asc">Sort: Amount (Low-High)</option>
                    </Select>
                    <Button variant="outline" onClick={() => setIsFilterOpen(true)} className="relative">
                        <FilterIcon />
                        <span className="ml-2 hidden sm:inline">Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                    {activeFilterCount > 0 && <Button variant="ghost" onClick={handleClearFilters}>Clear</Button>}
                </div>
            </div>
            
             {filteredAndSortedExpenses.length === 0 ? (
                <div className="text-center py-16">
                    <div className="inline-block bg-muted text-muted-foreground p-4 rounded-full">
                       <SearchXIcon className="h-12 w-12" />
                    </div>
                    <h3 className="text-2xl font-semibold mt-6">No Matching Expenses</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">Try adjusting your search or filter criteria to find what you're looking for.</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {filteredAndSortedExpenses.map(expense => (
                        <ExpenseCard key={expense.id} expense={expense} onEdit={handleEdit} onDelete={handleDelete} currencyCode={currency.code} />
                    ))}
                </ul>
            )}

            <EditExpenseDialog
                isOpen={!!isEditing}
                expense={isEditing}
                onClose={() => setIsEditing(null)}
                onSave={handleSaveEdit}
            />
            <FilterDialog 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={setFilters}
                onClear={handleClearFilters}
                currentFilters={filters}
                paymentMethods={paymentMethods}
            />
            <Dialog open={!!expenseIdToDelete} onClose={() => setExpenseIdToDelete(null)} aria-labelledby="delete-confirm-title">
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle id="delete-confirm-title">Are you sure?</DialogTitle>
                    </DialogHeader>
                    <p className="py-4 text-muted-foreground">
                        This will permanently delete this expense. This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExpenseIdToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Yes, Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ExpenseHistory;
