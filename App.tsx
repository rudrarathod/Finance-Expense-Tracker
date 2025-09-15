

import React, { useEffect } from 'react';
import { useAppContext } from './hooks/useAppContext';
import { AppTab, Theme } from './types';
import Dashboard from './components/Dashboard';
import AddExpense from './components/AddExpense';
import ExpenseHistory from './components/ExpenseHistory';
import ExpenseCalendar from './components/ExpenseCalendar';
import ProfileSlider from './components/ProfileSlider';
import Reports from './components/Reports';
import { cn } from './lib/data';

// --- ICONS ---
const HomeIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const PlusIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const HistoryIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M12 8v4l4 2"/></svg>;
const CalendarIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const MenuIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const AlertCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const BarChartIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>;


// --- Header ---
const Header = () => {
    const { toggleProfileSlider } = useAppContext();
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl" role="img" aria-label="money bag">💰</span>
                    <h1 className="text-xl font-bold">ExpenseTracker</h1>
                </div>
                <button onClick={toggleProfileSlider} className="p-2 rounded-full hover:bg-accent">
                    <MenuIcon />
                </button>
            </div>
        </header>
    );
};

// --- Bottom Navigation ---
const BottomNavigation = () => {
    const { activeTab, setActiveTab } = useAppContext();

    // Group items for a centered-button layout
    const navConfig = {
        left: [
            { tab: AppTab.Dashboard, icon: HomeIcon, label: 'Home' },
            { tab: AppTab.History, icon: HistoryIcon, label: 'History' },
        ],
        center: { tab: AppTab.AddExpense, icon: PlusIcon, label: 'Add Expense' },
        right: [
            { tab: AppTab.Reports, icon: BarChartIcon, label: 'Reports' },
            { tab: AppTab.Calendar, icon: CalendarIcon, label: 'Calendar' },
        ]
    };

    const NavButton = ({ tab, icon: Icon, label }: { tab: AppTab; icon: React.ComponentType<{className?: string}>; label: string; }) => (
         <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
                'flex flex-col items-center justify-center space-y-1 w-full h-full rounded-lg transition-colors',
                activeTab === tab ? 'text-primary' : 'text-muted-foreground',
                'hover:bg-accent'
            )}
        >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center">
                <div className="flex flex-1 justify-around">
                    {navConfig.left.map(item => <NavButton key={item.tab} {...item} />)}
                </div>
                
                <button
                    onClick={() => setActiveTab(navConfig.center.tab)}
                    className="relative -mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                    aria-label={navConfig.center.label}
                >
                    <navConfig.center.icon className="h-8 w-8" />
                </button>

                <div className="flex flex-1 justify-around">
                     {navConfig.right.map(item => <NavButton key={item.tab} {...item} />)}
                </div>
            </div>
        </nav>
    );
};


// --- Toaster ---
const Toaster = () => {
    const { toasts, removeToast } = useAppContext();
    
    useEffect(() => {
        const timers = toasts.map(toast => 
            setTimeout(() => {
                removeToast(toast.id);
            }, 5000)
        );
        return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toasts]);

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm p-4 space-y-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={cn(
                        'flex items-center p-4 rounded-lg shadow-lg text-white animate-in slide-in-from-bottom-5',
                        toast.type === 'success' ? 'bg-primary' : 'bg-destructive'
                    )}
                >
                    {toast.type === 'success' ? <CheckCircleIcon /> : <AlertCircleIcon />}
                    <p className="flex-1 mx-3">{toast.message}</p>
                    <button onClick={() => removeToast(toast.id)} className="p-1 rounded-full hover:bg-white/20">
                        <XIcon />
                    </button>
                </div>
            ))}
        </div>
    );
};

// --- App ---
function App() {
    const { activeTab } = useAppContext();

    const renderContent = () => {
        switch (activeTab) {
            case AppTab.Dashboard: return <Dashboard />;
            case AppTab.AddExpense: return <AddExpense />;
            case AppTab.History: return <ExpenseHistory />;
            case AppTab.Calendar: return <ExpenseCalendar />;
            case AppTab.Reports: return <Reports />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Header />
            <main className="pb-20">
                {renderContent()}
            </main>
            <Toaster />
            <ProfileSlider />
            <BottomNavigation />
        </div>
    );
}

export default App;