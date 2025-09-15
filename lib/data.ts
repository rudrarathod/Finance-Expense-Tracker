
import { Category, Expense, Suggestion, AIReport } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// Centralize API key and GoogleGenAI instance for reuse.
const GEMINI_API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Declare global for SheetJS library from CDN
declare var XLSX: any;

// --- CONSTANTS ---
export const CURRENCY_LIST = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
];

export const CATEGORIES = Object.values(Category);

export const CATEGORY_DETAILS: { [key in Category]: { icon: string; color: string } } = {
  [Category.Food]: { icon: '🍕', color: 'bg-red-500' },
  [Category.Transport]: { icon: '🚗', color: 'bg-blue-500' },
  [Category.Entertainment]: { icon: '🎬', color: 'bg-purple-500' },
  [Category.Shopping]: { icon: '🛍️', color: 'bg-pink-500' },
  [Category.BillPayments]: { icon: '🧾', color: 'bg-yellow-500' },
  [Category.Other]: { icon: '📦', color: 'bg-gray-500' },
};

// --- STORAGE SERVICE ---
export const storageService = {
  getExpenses: (): Expense[] => {
    try {
      const storedExpenses = localStorage.getItem('expenses');
      if (storedExpenses) {
        return JSON.parse(storedExpenses);
      }
      // If no expenses are found, return an empty array.
      return [];
    } catch (error) {
      console.error('Failed to retrieve expenses:', error);
      return [];
    }
  },
  saveExpenses: (expenses: Expense[]) => {
    try {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  },
  getMonthlyBudgets: (): { [key: string]: number } => {
    try {
      const storedBudgets = localStorage.getItem('monthlyBudgets');
      return storedBudgets ? JSON.parse(storedBudgets) : {};
    } catch (error) {
      console.error('Failed to retrieve monthly budgets:', error);
      return {};
    }
  },
  saveMonthlyBudgets: (budgets: { [key: string]: number }) => {
    try {
      localStorage.setItem('monthlyBudgets', JSON.stringify(budgets));
    } catch (error) {
      console.error('Failed to save monthly budgets:', error);
    }
  },
  getDefaultBudget: (): number => {
    try {
      const storedBudget = localStorage.getItem('defaultBudget');
      // Return the stored budget if it exists, otherwise default to 2000.
      return storedBudget ? JSON.parse(storedBudget) : 2000;
    } catch (error) {
      console.error('Failed to retrieve default budget:', error);
      return 2000;
    }
  },
  saveDefaultBudget: (budget: number) => {
    try {
      localStorage.setItem('defaultBudget', JSON.stringify(budget));
    } catch (error) {
      console.error('Failed to save default budget:', error);
    }
  },
  getDefaultCategory: (): Category => {
    try {
        const storedCategory = localStorage.getItem('defaultCategory');
        // Ensure the stored value is a valid Category enum member for robustness.
        if (storedCategory && Object.values(Category).includes(storedCategory as Category)) {
            return storedCategory as Category;
        }
        return Category.Food;
    } catch (error) {
        console.error('Failed to retrieve default category:', error);
        return Category.Food;
    }
  },
  saveDefaultCategory: (category: Category) => {
    try {
        localStorage.setItem('defaultCategory', category);
    } catch (error) {
        console.error('Failed to save default category:', error);
    }
  },
  getDefaultPaymentMethod: (): string => {
      try {
          const storedMethod = localStorage.getItem('defaultPaymentMethod');
          return storedMethod || '';
      } catch (error) {
          console.error('Failed to retrieve default payment method:', error);
          return '';
      }
  },
  saveDefaultPaymentMethod: (method: string) => {
      try {
          localStorage.setItem('defaultPaymentMethod', method);
      } catch (error) {
          console.error('Failed to save default payment method:', error);
      }
  },
  getCurrency: (): { code: string; symbol: string } => {
    try {
      const stored = localStorage.getItem('currency');
      return stored ? JSON.parse(stored) : { code: 'INR', symbol: '₹' };
    } catch (error) {
      console.error('Failed to retrieve currency:', error);
      return { code: 'INR', symbol: '₹' };
    }
  },
  saveCurrency: (currency: { code: string; symbol: string }) => {
    try {
      localStorage.setItem('currency', JSON.stringify(currency));
    } catch (error) {
      console.error('Failed to save currency:', error);
    }
  },
};

// --- AI OCR SERVICE ---
export const ocrService = {
  processReceipt: async (imageData: string, mimeType: string): Promise<Partial<Expense>> => {
    try {
      const imagePart = {
        inlineData: { data: imageData, mimeType },
      };

      const textPart = {
        text: `First, determine if this image is a transaction receipt. 
        If it is not, set 'isReceipt' to false and provide a reason. 
        If it IS a receipt, set 'isReceipt' to true and extract the following details:
        1. Total amount.
        2. Merchant name.
        3. Date in YYYY-MM-DD format.
        4. A suggested category from this list: ${CATEGORIES.join(', ')}.
        5. The UTR (Unique Transaction Reference) or Transaction ID, if available.
        6. The payment method or app used (e.g., Google Pay, Credit Card, UPI), if visible.
        Return the result as a valid JSON object that adheres to the provided schema.`
      };

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          isReceipt: { type: Type.BOOLEAN, description: 'True if the image is a transaction receipt.' },
          reason: { type: Type.STRING, description: 'Reason why it is not a receipt, if applicable.'},
          amount: { type: Type.NUMBER, description: 'The total amount on the receipt.' },
          merchant: { type: Type.STRING, description: 'The name of the store or merchant.' },
          date: { type: Type.STRING, description: 'The date of the transaction in YYYY-MM-DD format.' },
          category: { type: Type.STRING, enum: CATEGORIES, description: 'A suggested category for the expense.' },
          utr: { type: Type.STRING, description: 'The Unique Transaction Reference (UTR) or transaction ID.'},
          paymentMethod: { type: Type.STRING, description: 'The payment app or mode of transaction (e.g., Google Pay, Credit Card).'}
        },
        required: ['isReceipt']
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });
      
      const jsonResponse = JSON.parse(response.text);

      if (!jsonResponse.isReceipt) {
        // Log the AI's reason for debugging, but throw a generic error for a better user experience.
        console.log("AI rejection reason:", jsonResponse.reason);
        throw new Error("The uploaded image does not appear to be a valid receipt. Please try another image or enter details manually.");
      }

      const dateString = jsonResponse.date;
      
      let expenseDate;
      if (dateString && typeof dateString === 'string') {
        const parts = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (parts) {
            const [, year, month, day] = parts.map(Number);
            expenseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        } else {
            // Fallback for other date formats that might be parsed as local time.
            // We create a date object, then reconstruct it in UTC from its parts to neutralize timezone shifts.
            const tempDate = new Date(dateString);
            if (!isNaN(tempDate.getTime())) {
                expenseDate = new Date(Date.UTC(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate(), 12, 0, 0));
            }
        }
      }

      if (!expenseDate || isNaN(expenseDate.getTime())) {
        throw new Error(`AI returned an unreadable date: "${dateString || 'no date provided'}".`);
      }

      const validCategory = CATEGORIES.includes(jsonResponse.category) ? jsonResponse.category : Category.Other;
      
      return {
        amount: jsonResponse.amount,
        merchant: jsonResponse.merchant,
        date: expenseDate.toISOString(),
        category: validCategory,
        utr: jsonResponse.utr,
        paymentMethod: jsonResponse.paymentMethod,
      };
    } catch (error) {
      console.error("Error processing receipt with Gemini API:", error);
      
      // Prioritize our custom error for unreadable dates.
      if (error instanceof Error && error.message.includes("unreadable date")) {
          throw new Error("AI returned an unreadable date. Please enter it manually.");
      }

      // Preserve the specific "not a receipt" error message from our prompt logic.
      if (error instanceof Error && error.message.includes("does not appear to be a valid receipt")) {
          throw new Error(error.message);
      }
      
      // Check for rate limit / quota exhaustion errors from the API.
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
        throw new Error("Rate limit exceeded. Please wait a moment before uploading more receipts.");
      }

      // For all other errors, throw a generic but helpful message.
      throw new Error("Failed to analyze receipt. The AI model could not extract the details.");
    }
  },
};

// --- IMPORTER SERVICE ---
const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const importerService = {
  async processFile(file: File): Promise<Partial<Expense>[]> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'json':
        return this.parseJson(file);
      case 'csv':
      case 'xlsx':
      case 'xls':
        return this.parseSheet(file);
      case 'pdf':
        return this.parsePdf(file);
      default:
        throw new Error('Unsupported file type. Please upload JSON, CSV, Excel, or PDF.');
    }
  },

  parseJson(file: File): Promise<Partial<Expense>[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target?.result as string);
                if (!Array.isArray(data)) {
                    throw new Error("JSON file is not an array of expense objects.");
                }
                // Basic validation and mapping to ensure data shape
                const expenses = data.map(item => ({
                    amount: item.amount,
                    category: Object.values(Category).includes(item.category) ? item.category : Category.Other,
                    date: item.date,
                    merchant: item.merchant,
                    notes: item.notes,
                    utr: item.utr,
                    paymentMethod: item.paymentMethod,
                }));
                resolve(expenses);
            } catch (error) {
                reject(new Error("Failed to parse JSON file. Ensure it's correctly formatted."));
            }
        };
        reader.onerror = () => reject(new Error("Error reading JSON file."));
    });
  },

  parseSheet(file: File): Promise<Partial<Expense>[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = (e) => {
            try {
                // FIX: Use the declared global 'XLSX' directly instead of 'window.XLSX'
                // to avoid TypeScript errors, as 'XLSX' is not a standard property on the Window object.
                if (!XLSX) {
                    throw new Error("SheetJS library (XLSX) not loaded.");
                }
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                const headerMapping: { [key in keyof Expense]?: string[] } = {
                    date: ['date', 'transaction date'],
                    amount: ['amount', 'value', 'price', 'debit'],
                    merchant: ['merchant', 'description', 'payee', 'name'],
                    category: ['category', 'type'],
                    notes: ['notes', 'memo'],
                    paymentMethod: ['payment method', 'paymentmode'],
                    utr: ['utr', 'transaction id', 'id'],
                };
                
                const normalizeHeader = (h: string) => h.toString().toLowerCase().replace(/[^a-z0-9]/g, '');

                const mappedExpenses = json.map((row: any) => {
                    const expense: Partial<Expense> = {};
                    for (const rawHeader in row) {
                        const normalizedHeader = normalizeHeader(rawHeader);
                        for (const key in headerMapping) {
                            if (headerMapping[key as keyof Expense]?.map(normalizeHeader).includes(normalizedHeader)) {
                                (expense as any)[key] = row[rawHeader];
                                break;
                            }
                        }
                    }

                    if (expense.date) {
                        let parsedDate: Date | null = null;
                        const dateValue = expense.date;

                        if (typeof dateValue === 'number') { // Handle Excel's numeric date format
                            parsedDate = new Date((dateValue - 25569) * 86400 * 1000);
                        } else if (typeof dateValue === 'string') {
                            const d = new Date(dateValue);
                            if (!isNaN(d.getTime())) parsedDate = d;
                        }

                        if (parsedDate && !isNaN(parsedDate.getTime())) {
                            expense.date = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 12, 0, 0)).toISOString();
                        } else {
                            delete expense.date; // Invalid date
                        }
                    }

                    if (typeof expense.amount === 'string') {
                       // FIX: Cast expense.amount to `any` to allow string operations.
                       // TypeScript infers `expense.amount` as `number | undefined` based on the `Expense` type,
                       // but data from sheets can be strings (e.g., with currency symbols).
                       expense.amount = parseFloat((expense.amount as any).replace(/[^0-9.-]+/g,""));
                    }

                    return expense;
                });
                resolve(mappedExpenses);
            } catch (error) {
                console.error("Sheet parsing error:", error);
                reject(new Error("Failed to parse the spreadsheet."));
            }
        };
        reader.onerror = () => reject(new Error("Error reading spreadsheet file."));
    });
  },

  async parsePdf(file: File): Promise<Partial<Expense>[]> {
    try {
        const fileDataUrl = await fileToDataUrl(file);
        const [header, base64Data] = fileDataUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1];

        if (!mimeType || !base64Data || mimeType !== 'application/pdf') {
            throw new Error("Invalid file. Please upload a PDF.");
        }
        
        const filePart = {
            inlineData: { data: base64Data, mimeType },
        };
        
        const textPart = {
            text: `Analyze this financial statement. Extract all individual expense transactions (debits/payments), ignoring any credits or deposits. For each expense, provide:
            1. date: The transaction date in YYYY-MM-DD format.
            2. merchant: The merchant name or a concise transaction description.
            3. amount: The transaction amount as a positive number.
            4. category: A suggested category from this list: ${CATEGORIES.join(', ')}. Default to 'Other' if unsure.
            Return a single valid JSON array of objects. If the document has no expenses, return an empty array [].`
        };

        const responseSchema = {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: 'Transaction date (YYYY-MM-DD)' },
                merchant: { type: Type.STRING, description: 'Merchant name or description' },
                amount: { type: Type.NUMBER, description: 'Transaction amount (positive number)' },
                category: { type: Type.STRING, enum: CATEGORIES, description: 'Suggested category' },
              },
              required: ['date', 'merchant', 'amount']
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [filePart, textPart] },
            config: { responseMimeType: "application/json", responseSchema },
        });
        
        // Final validation and date formatting
        const parsedData = JSON.parse(response.text);
        if (!Array.isArray(parsedData)) return [];

        return parsedData.map(item => {
            try {
                // Ensure date is valid and converted to consistent ISO format
                const d = new Date(item.date);
                if (isNaN(d.getTime())) return null;
                item.date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)).toISOString();
                return item;
            } catch {
                return null;
            }
        }).filter(Boolean);

    } catch (error) {
        console.error("Error processing PDF with Gemini API:", error);
        throw new Error("Failed to analyze PDF file with AI.");
    }
  },
};

// --- AI INSIGHTS SERVICE ---
export const aiInsightsService = {
  // FIX: Add missing `getSavingsSuggestions` method to resolve error in `AIInsights.tsx`.
  // This function provides a simplified AI analysis focused on actionable savings tips.
  getSavingsSuggestions: async (expenses: Expense[]): Promise<Suggestion[]> => {
    try {
        // To avoid sending too much data, let's take the last 100 expenses.
        const recentExpenses = expenses.slice(0, 100);
        const simplify = (exp: Expense) => ({ a: exp.amount, c: exp.category, m: exp.merchant, d: exp.date.substring(0, 10) });

        const prompt = `Analyze the following list of user expenses. Provide 2-3 actionable savings suggestions. Each suggestion should have a clear title, a brief description, and must be associated with one of these categories: ${CATEGORIES.join(', ')}.
        
        Expenses: ${JSON.stringify(recentExpenses.map(simplify))}
        
        Return a valid JSON array of suggestion objects. If no clear suggestions can be made, return an empty array.`;

        const responseSchema = {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'The title of the savings suggestion.' },
                description: { type: Type.STRING, description: 'A short description of the suggestion.' },
                category: { type: Type.STRING, enum: CATEGORIES, description: 'The most relevant expense category.' },
              },
              required: ['title', 'description', 'category']
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema },
        });

        const suggestions = JSON.parse(response.text);
        return suggestions;

    } catch (error) {
        console.error("Error getting savings suggestions from Gemini API:", error);
        throw new Error("Failed to get AI savings suggestions. The model might be temporarily unavailable.");
    }
  },
  getAdvancedAnalysis: async (currentPeriodExpenses: Expense[], previousPeriodExpenses: Expense[]): Promise<AIReport> => {
    if (currentPeriodExpenses.length === 0) {
        throw new Error("Not enough data for the current period to generate a report.");
    }

    try {
        const simplify = (exp: Expense) => ({ a: exp.amount, c: exp.category, m: exp.merchant, d: exp.date.substring(0, 10) });

        const prompt = `You are a financial analyst AI. Here is a user's spending data.
        Current period expenses: ${JSON.stringify(currentPeriodExpenses.map(simplify))}
        Previous period expenses: ${JSON.stringify(previousPeriodExpenses.map(simplify))}

        Analyze this data and provide a report in the following JSON format.
        1.  **recurringExpenses**: Identify transactions that seem to be recurring subscriptions or bills. Look for consistent merchant names and similar amounts at regular intervals. Provide a brief description.
        2.  **anomalies**: Point out any unusually large one-time expenses or significant spikes in spending that deviate from the user's typical patterns.
        3.  **summary**: Provide a brief, actionable summary (2-3 sentences) of the user's spending behavior for the period, highlighting key trends or areas for attention.
        
        Return ONLY the JSON object adhering to the schema. If a section has no items, return an empty array.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                recurringExpenses: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            merchant: { type: Type.STRING },
                            amount: { type: Type.NUMBER },
                            description: { type: Type.STRING }
                        },
                        required: ["merchant", "amount", "description"]
                    }
                },
                anomalies: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            amount: { type: Type.NUMBER },
                            date: { type: Type.STRING }
                        },
                        required: ["description", "amount", "date"]
                    }
                },
                summary: { type: Type.STRING }
            },
            required: ["recurringExpenses", "anomalies", "summary"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema },
        });

        const report = JSON.parse(response.text);

        // Manual calculation for spending changes as it's more reliable than asking the AI for precise numbers.
        const currentCategoryTotals = currentPeriodExpenses.reduce((acc, { category, amount }) => {
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {} as { [key in Category]?: number });

        const previousCategoryTotals = previousPeriodExpenses.reduce((acc, { category, amount }) => {
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {} as { [key in Category]?: number });
        
        const spendingChanges = (Object.keys(currentCategoryTotals) as Category[]).map(cat => {
            const currentAmount = currentCategoryTotals[cat] || 0;
            const previousAmount = previousCategoryTotals[cat] || 0;
            const changePercentage = previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : (currentAmount > 0 ? 100 : 0);
            return { category: cat, currentAmount, previousAmount, changePercentage };
        });

        return { ...report, spendingChanges };

    } catch (error) {
        console.error("Error getting advanced analysis from Gemini API:", error);
        throw new Error("Failed to get AI analysis. The model might be temporarily unavailable.");
    }
  },
};

// --- UTILITY FUNCTIONS ---
export const cn = (...classes: (string | boolean | undefined | null)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC', // Display date in UTC to avoid timezone shifts
    };
    return new Date(dateString).toLocaleDateString(undefined, options || defaultOptions);
};

export const formatCurrency = (amount: number, currencyCode = 'INR') => {
    try {
        // Use a generic 'en' locale; the format is primarily driven by the currency code.
        return new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode }).format(amount);
    } catch (error) {
        // If the code is invalid, Intl.NumberFormat throws a RangeError.
        // Fallback to INR for a stable user experience.
        console.warn(`Invalid currency code provided: "${currencyCode}". Falling back to INR.`);
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    }
};
