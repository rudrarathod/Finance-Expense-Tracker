import React, { useState, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { aiInsightsService, CATEGORY_DETAILS } from '../lib/data';
import { Suggestion } from '../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from './ui';

const SparklesIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9z"/></svg>;
const RefreshCwIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M3 21a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 16"/><path d="M21 11v5h-5"/></svg>;

const AIInsights = () => {
    const { expenses, toast } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuggestions(null);

        if (expenses.length < 10) {
            setError("You need at least 10 expenses for a meaningful analysis.");
            setLoading(false);
            return;
        }

        try {
            const result = await aiInsightsService.getSavingsSuggestions(expenses);
            if (result.length === 0) {
                toast("AI couldn't find any specific savings suggestions right now.", 'success');
            }
            setSuggestions(result);
        } catch (err) {
            const errorMessage = (err as Error).message;
            setError(errorMessage);
            toast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [expenses, toast]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-4">
                    <p className="text-center text-muted-foreground animate-pulse">AI is analyzing your spending habits...</p>
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-5/6" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-12">
                     <span className="text-5xl" role="img" aria-label="sad face">😟</span>
                     <h3 className="text-xl font-semibold mt-4">Analysis Failed</h3>
                     <p className="text-destructive mt-1">{error}</p>
                     <Button className="mt-6" onClick={handleAnalyze}>Try Again</Button>
                </div>
            )
        }

        if (suggestions) {
            if (suggestions.length === 0) {
                 return (
                    <div className="text-center py-12">
                        <span className="text-5xl" role="img" aria-label="shrug">🤷</span>
                        <h3 className="text-xl font-semibold mt-4">All Clear!</h3>
                        <p className="text-muted-foreground mt-1 max-w-md mx-auto">Our AI didn't spot any obvious ways to save. Keep up the good work!</p>
                        <Button variant="outline" className="mt-6" onClick={handleAnalyze}>
                            <RefreshCwIcon className="h-4 w-4 mr-2" />
                            Re-analyze Spending
                        </Button>
                    </div>
                );
            }
            return (
                 <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Your AI Savings Plan</h2>
                        <Button variant="outline" onClick={handleAnalyze} size="sm">
                             <RefreshCwIcon className="h-4 w-4" />
                        </Button>
                     </div>
                    {suggestions.map((s, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center space-x-4 space-y-0 pb-2">
                                <span className="text-3xl p-2 bg-muted rounded-xl">{s.category && CATEGORY_DETAILS[s.category] ? CATEGORY_DETAILS[s.category].icon : '💡'}</span>
                                <CardTitle>{s.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{s.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            );
        }

        // Initial state
        return (
            <div className="text-center py-16">
                <div className="inline-block bg-primary/10 text-primary p-4 rounded-full">
                    <SparklesIcon className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-semibold mt-6">Unlock Personalized Savings Tips</h2>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">Let our AI analyze your spending patterns to find hidden opportunities for you to save money.</p>
                <p className="text-sm text-muted-foreground mt-2">(At least 10 expenses are recommended for best results)</p>
                <Button className="mt-8" size="lg" onClick={handleAnalyze} disabled={expenses.length < 5}>
                    Analyze My Spending
                </Button>
            </div>
        );
    }
    
    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold tracking-tight mb-6">AI Insights</h1>
            {renderContent()}
        </div>
    );
};

export default AIInsights;
