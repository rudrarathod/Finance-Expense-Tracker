import React, { useState, useRef, ChangeEvent } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Button, Input, Select, Textarea, Label, Card, CardContent, CardHeader, CardTitle, Skeleton } from './ui';
import { Expense, Category } from '../types';
import { CATEGORIES, ocrService, formatCurrency, formatDate } from '../lib/data';

// --- ICONS ---
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>;
const LoaderIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>;
const UploadCloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const AlertCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const XIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

// --- TYPES ---
type AddMode = 'single' | 'bulk';

interface ProcessedReceipt {
  id: string;
  fileName: string;
  status: 'processing' | 'success' | 'error' | 'added' | 'duplicate';
  data?: Partial<Expense>;
  error?: string;
  receiptImage?: string;
}

// --- SUB-COMPONENTS ---
const ProcessedReceiptCard = ({ receipt, onAdd, onRemove, currencyCode }: { receipt: ProcessedReceipt; onAdd: (receipt: ProcessedReceipt) => void; onRemove: (id: string) => void; currencyCode: string; }) => {
    const renderStatus = () => {
        switch (receipt.status) {
            case 'processing':
                return <div className="flex items-center text-muted-foreground"><LoaderIcon className="animate-spin h-4 w-4 mr-2" /> Analyzing...</div>;
            case 'added':
                return <div className="flex items-center text-green-600"><CheckCircleIcon /> <span className="ml-2 font-semibold">Added</span></div>;
            case 'error':
            case 'duplicate':
                return <div className="flex items-center text-destructive"><AlertCircleIcon /> <span className="ml-2 font-semibold">{receipt.error}</span></div>;
            case 'success':
                return <Button size="sm" onClick={() => onAdd(receipt)}>Add Expense</Button>;
        }
    };

    return (
        <div className="bg-muted/50 p-4 rounded-lg flex items-center space-x-4 relative">
            {receipt.status !== 'processing' && receipt.status !== 'added' && (
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => onRemove(receipt.id)}>
                    <XIcon className="h-4 w-4" />
                </Button>
            )}
            {receipt.receiptImage && (
                <img src={receipt.receiptImage} alt={receipt.fileName} className="w-16 h-16 rounded-md object-cover" />
            )}
            <div className="flex-1">
                <p className="font-semibold truncate">{receipt.data?.merchant || receipt.fileName}</p>
                {receipt.data?.amount && <p className="text-sm font-bold text-primary">{formatCurrency(receipt.data.amount, currencyCode)}</p>}
                {receipt.data?.date && <p className="text-xs text-muted-foreground">{formatDate(receipt.data.date)}</p>}
            </div>
            <div className="w-40 text-right">
                {renderStatus()}
            </div>
        </div>
    );
};

const AddExpense = () => {
  const { addExpense, toast, expenses, defaultCategory, defaultPaymentMethod, currency } = useAppContext();
  const initialFormState = {
    amount: '',
    category: defaultCategory,
    // FIX: Create a timezone-safe 'YYYY-MM-DD' string for today's date using a locale known for that format.
    // This prevents the default date from being off by one day in certain timezones, which can happen with `toISOString()`.
    date: new Date().toLocaleDateString('sv-SE'),
    merchant: '',
    notes: '',
    utr: '',
    paymentMethod: defaultPaymentMethod,
    receiptImage: undefined as string | undefined,
  };

  const [formState, setFormState] = useState(initialFormState);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New state for bulk mode
  const [mode, setMode] = useState<AddMode>('single');
  const [processedReceipts, setProcessedReceipts] = useState<ProcessedReceipt[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingOcr(true);
      setReceiptPreview(null);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileDataUrl = reader.result as string;
        setReceiptPreview(fileDataUrl);
        setFormState(prev => ({...prev, receiptImage: fileDataUrl }));

        try {
            const mimeType = file.type;
            const base64Data = fileDataUrl.split(',')[1];
            
            const ocrResult = await ocrService.processReceipt(base64Data, mimeType);
            
            if (ocrResult.utr && ocrResult.paymentMethod && expenses.some(exp => exp.utr === ocrResult.utr && exp.paymentMethod === ocrResult.paymentMethod)) {
                toast('Duplicate transaction detected.', 'error');
                setIsProcessingOcr(false);
                if(fileInputRef.current) fileInputRef.current.value = "";
                setReceiptPreview(null);
                return;
            }

            setFormState(prev => ({
                ...prev,
                amount: ocrResult.amount?.toString() ?? '',
                category: ocrResult.category ?? defaultCategory,
                merchant: ocrResult.merchant ?? '',
                date: ocrResult.date?.split('T')[0] ?? prev.date,
                utr: ocrResult.utr ?? '',
                paymentMethod: ocrResult.paymentMethod ?? defaultPaymentMethod,
            }));
            toast('Receipt analyzed with AI! Please verify.', 'success');
        } catch (error) {
            console.error(error);
            toast((error as Error).message || 'Could not analyze receipt.', 'error');
        } finally {
            setIsProcessingOcr(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBulkFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsBulkProcessing(true);

    const newReceipts: ProcessedReceipt[] = Array.from(files).map((file, i) => ({
        id: `${file.name}-${Date.now()}-${i}`,
        fileName: file.name,
        status: 'processing',
    }));
    
    // Use a local variable to track the state through the async loop
    // to prevent race conditions from multiple `setProcessedReceipts` calls.
    let currentReceipts = [...processedReceipts, ...newReceipts];
    setProcessedReceipts(currentReceipts);

    // Set to track unique identifiers (UTR|PaymentMethod) of receipts processed in this batch
    const processedInBatch = new Set<string>();
    
    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // Sequentially process files to avoid overwhelming the API
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const receiptToProcess = newReceipts[i];
        
        let fileDataUrl = '';
        try {
            fileDataUrl = await readFileAsDataURL(file);
            const mimeType = file.type;
            const base64Data = fileDataUrl.split(',')[1];
            
            const ocrResult = await ocrService.processReceipt(base64Data, mimeType);
            
            const uniqueId = ocrResult.utr && ocrResult.paymentMethod ? `${ocrResult.utr}|${ocrResult.paymentMethod}`.trim() : null;

            // Check 1: Against already saved expenses
            const isDuplicateInStorage = uniqueId ? expenses.some(exp => exp.utr === ocrResult.utr && exp.paymentMethod === ocrResult.paymentMethod) : false;
            
            // Check 2: Against receipts processed in this batch
            const isDuplicateInBatch = uniqueId ? processedInBatch.has(uniqueId) : false;

            if (isDuplicateInStorage || isDuplicateInBatch) {
                const errorMsg = isDuplicateInStorage ? 'Duplicate transaction.' : 'Duplicate in this batch.';
                currentReceipts = currentReceipts.map(r => r.id === receiptToProcess.id ? { ...r, status: 'duplicate', error: errorMsg } : r);
            } else {
                 if (uniqueId) {
                     processedInBatch.add(uniqueId);
                 }
                 currentReceipts = currentReceipts.map(r => r.id === receiptToProcess.id ? { ...r, status: 'success', data: ocrResult, receiptImage: fileDataUrl } : r);
            }
        } catch (error) {
            currentReceipts = currentReceipts.map(r => r.id === receiptToProcess.id ? { ...r, status: 'error', error: (error as Error).message, receiptImage: fileDataUrl || undefined } : r);
        }
        // Set the state with the updated list after each file is processed.
        setProcessedReceipts(currentReceipts);
        
        // Add a delay after each API call to avoid hitting rate limits.
        if (i < files.length - 1) { // Don't delay after the last file
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
    }

    setIsBulkProcessing(false);
    if(bulkFileInputRef.current) bulkFileInputRef.current.value = "";
  };
  
  const handleAddFromBulk = (receipt: ProcessedReceipt, suppressToast = false) => {
    if (!receipt.data) return;

    const expenseData: Omit<Expense, 'id'> = {
        amount: receipt.data.amount || 0,
        category: receipt.data.category || Category.Other,
        date: receipt.data.date ? new Date(receipt.data.date).toISOString() : new Date().toISOString(),
        merchant: receipt.data.merchant || 'Unknown Merchant',
        notes: `Bulk upload from ${receipt.fileName}`,
        receiptImage: receipt.receiptImage,
        utr: receipt.data.utr || '',
        paymentMethod: receipt.data.paymentMethod || '',
    };

    if (expenseData.amount <= 0) {
        toast('Cannot add expense with zero or negative amount.', 'error');
        setProcessedReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, status: 'error', error: 'Invalid amount.' } : r));
        return;
    }

    addExpense(expenseData);
    if (!suppressToast) {
        toast(`Added expense from ${receipt.fileName}`, 'success');
    }
    setProcessedReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, status: 'added' } : r));
  };

  const handleRemoveReceipt = (idToRemove: string) => {
    setProcessedReceipts(prev => prev.filter(r => r.id !== idToRemove));
  };
  
  const handleClearAll = () => {
      setProcessedReceipts([]);
  };

  const handleAddAll = async () => {
      const receiptsToAdd = processedReceipts.filter(r => r.status === 'success');
      if (receiptsToAdd.length === 0) {
          toast('No successful receipts to add.', 'error');
          return;
      }

      setIsAddingAll(true);
      let addedCount = 0;
      for (const receipt of receiptsToAdd) {
          handleAddFromBulk(receipt, true);
          addedCount++;
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for better UI feedback
      }
      setIsAddingAll(false);
      
      if (addedCount > 0) {
          toast(`Successfully added ${addedCount} expenses.`, 'success');
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.amount || parseFloat(formState.amount) <= 0) {
      toast('Please enter a valid amount.', 'error');
      return;
    }
    
    // FIX: Treat date input as UTC to prevent timezone-related date shifts.
    const dateParts = formState.date.split('-').map(Number);
    const expenseDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0));

    const expenseData: Omit<Expense, 'id'> = {
      ...formState,
      amount: parseFloat(formState.amount),
      date: expenseDate.toISOString()
    };
    addExpense(expenseData);
    toast('Expense added successfully!', 'success');
    setFormState(initialFormState);
    setReceiptPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleReset = () => {
    setFormState(initialFormState);
    setReceiptPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    toast('Form cleared', 'success');
  };

  const SingleEntryForm = () => (
    <Card>
        <CardHeader>
          <CardTitle>New Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ocr-upload">Scan with AI</Label>
              <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                 <CameraIcon />
                 <span className="ml-2">Upload or Scan Receipt</span>
              </Button>
              <input ref={fileInputRef} id="ocr-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {receiptPreview && (
                <div className="mt-4 relative">
                  <img src={receiptPreview} alt="Receipt preview" className="rounded-md max-h-60 w-full object-cover" />
                </div>
              )}
            </div>
            {isProcessingOcr && (
              <div className="space-y-4">
                <div className="flex items-center justify-center text-primary">
                    <LoaderIcon className="animate-spin" />
                    <p className="ml-2">Analyzing with AI...</p>
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" value={formState.amount} onChange={handleInputChange} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" value={formState.category} onChange={handleInputChange}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" value={formState.date} onChange={handleInputChange} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant</Label>
              <Input id="merchant" name="merchant" type="text" placeholder="e.g., Starbucks" value={formState.merchant} onChange={handleInputChange} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input id="paymentMethod" name="paymentMethod" type="text" placeholder="e.g., Credit Card" value={formState.paymentMethod} onChange={handleInputChange} />
            </div>
          
            <div className="space-y-2">
                <Label htmlFor="utr">UTR / Transaction ID</Label>
                <Input id="utr" name="utr" type="text" placeholder="Optional" value={formState.utr} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="e.g., Coffee with team" value={formState.notes} onChange={handleInputChange} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" className="w-full" onClick={handleReset}>
                    Reset Form
                </Button>
                <Button type="submit" className="w-full" disabled={isProcessingOcr}>
                    {isProcessingOcr ? 'Analyzing...' : 'Add Expense'}
                </Button>
            </div>
          </form>
        </CardContent>
    </Card>
  );

  const BulkUpload = () => {
    const successfulReceiptsCount = processedReceipts.filter(r => r.status === 'success').length;

    return (
     <Card>
        <CardHeader>
          <CardTitle>Bulk Receipt Upload</CardTitle>
          <p className="text-sm text-muted-foreground pt-1">Upload multiple receipts and add them one by one.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
                 <Label htmlFor="bulk-upload">Upload Receipts</Label>
                 <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => bulkFileInputRef.current?.click()}
                    disabled={isBulkProcessing || isAddingAll}
                  >
                    {isBulkProcessing ? <LoaderIcon className="animate-spin" /> : <UploadCloudIcon />}
                    <span className="ml-2">{isBulkProcessing ? 'Processing...' : 'Select Files'}</span>
                 </Button>
                 <input ref={bulkFileInputRef} id="bulk-upload" type="file" accept="image/*" className="hidden" onChange={handleBulkFileChange} multiple />
            </div>
            {processedReceipts.length > 0 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center border-b pb-2 mb-3">
                        <h3 className="font-semibold text-lg">Scanned Receipts</h3>
                        <Button variant="link" className="text-destructive hover:text-destructive/80 h-auto p-0" size="sm" onClick={handleClearAll} disabled={isBulkProcessing || isAddingAll}>
                            Clear All
                        </Button>
                    </div>

                    <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-2 -mr-2">
                        {processedReceipts.map(receipt => (
                            <ProcessedReceiptCard key={receipt.id} receipt={receipt} onAdd={handleAddFromBulk} onRemove={handleRemoveReceipt} currencyCode={currency.code} />
                        ))}
                    </div>

                    {successfulReceiptsCount > 0 && (
                        <Button 
                            className="w-full mt-2" 
                            onClick={handleAddAll} 
                            disabled={isAddingAll || isBulkProcessing}
                        >
                            {isAddingAll ? <LoaderIcon className="animate-spin mr-2 h-5 w-5" /> : null}
                            {isAddingAll ? 'Adding Expenses...' : `Add All (${successfulReceiptsCount}) Valid Receipts`}
                        </Button>
                    )}
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Add Expense</h1>
      <div className="mb-6 flex justify-center bg-muted p-1 rounded-lg">
        <Button variant={mode === 'single' ? 'default' : 'ghost'} onClick={() => setMode('single')} className="flex-1 transition-all">Single Entry</Button>
        <Button variant={mode === 'bulk' ? 'default' : 'ghost'} onClick={() => setMode('bulk')} className="flex-1 transition-all">Bulk Upload</Button>
      </div>
      
      {mode === 'single' ? <SingleEntryForm /> : <BulkUpload />}
    </div>
  );
};

export default AddExpense;
