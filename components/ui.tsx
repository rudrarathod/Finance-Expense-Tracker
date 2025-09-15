import React, { forwardRef, HTMLAttributes, ReactNode, useState, useMemo, useEffect, useRef } from 'react';
import { cn, formatDate } from '../lib/data';

// --- ICONS ---
const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const CalendarIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;


// --- Button ---
// FIX: Add variant and size props to Button component to support different styles.
// This resolves type errors where 'variant' and 'size' props were used without being defined.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant || 'default'],
          sizes[size || 'default'],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// --- Card ---
const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

// --- Input ---
const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// --- Textarea ---
const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => (
        <textarea
            className={cn(
                'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            ref={ref}
            {...props}
        />
    )
);
Textarea.displayName = "Textarea"


// --- Select ---
const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

// --- Label ---
const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  )
);
Label.displayName = 'Label';

// --- Dialog ---
const Dialog = ({ open, onClose, children, 'aria-labelledby': ariaLabelledby }: { open: boolean; onClose: () => void; children: ReactNode; 'aria-labelledby'?: string }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in-0"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledby}
    >
      <div
        ref={dialogRef}
        className="relative z-50 w-full max-w-lg rounded-lg border bg-background shadow-lg animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className }: { children: ReactNode, className?: string }) => (
  <div className={cn("p-6", className)}>{children}</div>
);

const DialogHeader = ({ children, className }: { children: ReactNode, className?: string }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left border-b pb-4", className)}>
    {children}
  </div>
);

const DialogTitle = ({ children, className, id }: { children: ReactNode, className?: string, id?: string }) => (
    <h2 id={id} className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>
);

const DialogFooter = ({ children, className }: { children: ReactNode, className?: string }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4", className)}>
    {children}
  </div>
);

// --- Progress Bar ---
const Progress = ({ value }: { value: number }) => (
    <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
        <div
            className="h-full w-full flex-1 bg-primary transition-all"
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </div>
);

// --- Skeleton Loader ---
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} />
);

// --- Calendar View Component ---
const Calendar = ({ value, onChange, className }: { value?: Date | null, onChange: (date: Date) => void, className?: string }) => {
    const [displayDate, setDisplayDate] = useState(value || new Date());

    useEffect(() => {
        // When the selected date (`value`) changes from the parent component,
        // update the calendar's internal display month to match it.
        // This ensures that if you select a date in a different month,
        // the calendar view jumps to that month.
        if (value) {
            setDisplayDate(value);
        }
    }, [value]);

    const { weeks, monthName, year } = useMemo(() => {
        const currentMonth = displayDate.getMonth();
        const currentYear = displayDate.getFullYear();
        const monthName = displayDate.toLocaleString('default', { month: 'long' });
        
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const startDate = new Date(startOfMonth);
        startDate.setDate(startDate.getDate() - startOfMonth.getDay());
        
        const days = Array.from({ length: 42 }).map((_, i) => {
            const day = new Date(startDate);
            day.setDate(day.getDate() + i);
            return day;
        });
        
        const weeks: Date[][] = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }

        return { weeks, monthName, year: currentYear };
    }, [displayDate]);

    const changeMonth = (offset: number) => {
        setDisplayDate(current => {
          const newDate = new Date(current);
          newDate.setMonth(current.getMonth() + offset, 1); // Set to day 1 to avoid month-end issues
          return newDate;
        });
    };
    
    return (
        <Card className={cn("p-3 w-full max-w-xs", className)}>
            <div className="flex items-center justify-between mb-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(-1)}> <ChevronLeft /> </Button>
                <div className="font-semibold text-sm">{monthName} {year}</div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(1)}> <ChevronRight /> </Button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {weeks.flat().map((d, i) => {
                    const isCurrentMonth = d.getMonth() === displayDate.getMonth();
                    const isToday = d.toDateString() === new Date().toDateString();
                    const isSelected = value?.toDateString() === d.toDateString();

                    return (
                        <Button
                            key={i}
                            variant={isSelected ? 'default' : (isToday ? 'outline' : 'ghost')}
                            size="icon"
                            className={cn("h-8 w-8 p-0 text-xs", !isCurrentMonth && "text-muted-foreground opacity-50 pointer-events-none")}
                            onClick={() => onChange(d)}
                        >
                            {d.getDate()}
                        </Button>
                    );
                })}
            </div>
        </Card>
    );
};


// --- Popover Component ---
const Popover = ({ open, onOpenChange, children, content }: { open: boolean, onOpenChange: (open: boolean) => void, children: ReactNode, content: ReactNode }) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
                contentRef.current && !contentRef.current.contains(event.target as Node)
            ) {
                onOpenChange(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            if (triggerRef.current && contentRef.current) {
                const triggerRect = triggerRef.current.getBoundingClientRect();
                contentRef.current.style.top = `${triggerRect.bottom + window.scrollY + 4}px`;
                
                const contentWidth = contentRef.current.offsetWidth;
                const windowWidth = window.innerWidth;
                
                // Adjust left position to prevent overflow
                let left = triggerRect.left + window.scrollX;
                if (left + contentWidth > windowWidth - 10) { // 10px buffer
                    left = windowWidth - contentWidth - 10;
                }
                contentRef.current.style.left = `${left}px`;
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open, onOpenChange]);

    return (
        <>
            <div ref={triggerRef} onClick={() => onOpenChange(!open)}>
                {children}
            </div>
            {open && (
                <div ref={contentRef} className="fixed z-50 animate-in fade-in-0 zoom-in-95 bg-popover">
                    {content}
                </div>
            )}
        </>
    );
};

// --- Date Picker Input ---
const DatePicker = ({ value, onChange, placeholder }: { value?: string, onChange: (date: string) => void, placeholder?: string }) => {
    const [open, setOpen] = useState(false);
    
    // Parse the date string as UTC to avoid timezone issues. The 'T12:00:00Z' ensures it's treated as midday UTC.
    const selectedDate = value ? new Date(value + 'T12:00:00Z') : null;

    const handleDateSelect = (date: Date) => {
        // Format the date back to 'YYYY-MM-DD' string format for storage.
        // Using `toLocaleDateString` with a locale that produces the desired format (sv-SE gives YYYY-MM-DD)
        // correctly captures the local date without timezone shifts that can happen with `toISOString()`.
        onChange(date.toLocaleDateString('sv-SE'));
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen} content={<Calendar value={selectedDate} onChange={handleDateSelect} />}>
            <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? formatDate(value, { timeZone: 'UTC' }) : <span className="text-muted-foreground">{placeholder || 'Pick a date'}</span>}
            </Button>
        </Popover>
    );
};


export { 
  Button, 
  Card, CardHeader, CardTitle, CardDescription, CardContent, 
  Input, Textarea, Select, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Progress, Skeleton,
  DatePicker
};