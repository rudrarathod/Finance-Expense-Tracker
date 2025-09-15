# 💰 Finance Expense Tracker

A comprehensive, mobile-first Finance Expense Tracker App to manage your expenses, visualize spending habits, and stay on budget, all with a beautiful, modern interface powered by React, TypeScript, and the Google Gemini API.

## ✨ Key Features

-   **Interactive Dashboard**: Get a clear overview of your monthly spending, budget progress, and category breakdowns with interactive charts and graphs.
-   **AI-Powered Receipt Scanning**: Snap a picture of your receipt, and let the Gemini API automatically extract the merchant, amount, date, and category.
-   **Bulk Upload**: Scan and process multiple receipts at once for efficient expense entry.
-   **Comprehensive History**: View, search, filter, and sort all your past transactions. Swipe gestures make editing and deleting a breeze.
-   **Calendar View**: Visualize your spending on a calendar to easily spot daily and weekly patterns.
-   **Advanced AI Reports**: Generate detailed reports that identify spending trends, potential recurring subscriptions, and spending anomalies.
-   **Data Portability**: Easily import expenses from JSON, CSV, Excel, or PDF files, and export your data to various formats for your records.
-   **Highly Customizable**: Tailor the app to your needs with light/dark themes, multiple currency options, and default settings for budgets, categories, and payment methods.
-   **Fully Responsive & Offline-Ready**: Designed for a seamless experience on any device, with all data stored locally in your browser for offline access.

## 🚀 Tech Stack

-   **Frontend**: [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (via CDN)
-   **Charting**: [Recharts](https://recharts.org/)
-   **AI & OCR**: [Google Gemini API](https://ai.google.dev/)
-   **Client-side Storage**: Browser `localStorage`

## 🛠️ Getting Started

### Prerequisites

-   A modern web browser (e.g., Chrome, Firefox, Safari).
-   A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the Application

1.  **Clone the repository or download the files.**
2.  **Set up your API Key**: The application expects the Gemini API key to be available as an environment variable. You will need to configure your local development server or environment to provide `process.env.API_KEY`.
3.  **Open `index.html`** in your web browser. The app should load and be ready to use.

> **Note**: For the best experience, it's recommended to serve the files through a local web server to avoid potential issues with browser security policies (CORS).

## 📂 Project Structure

```
.
├── components/          # React components for different app sections
│   ├── AddExpense.tsx
│   ├── AIInsights.tsx
│   ├── Dashboard.tsx
│   ├── ExpenseCalendar.tsx
│   ├── ExpenseHistory.tsx
│   ├── ProfileSlider.tsx
│   ├── Reports.tsx
│   ├── SpendingTrends.tsx
│   └── ui.tsx           # Reusable UI elements (Button, Card, etc.)
├── hooks/
│   └── useAppContext.tsx # Core context for state management
├── lib/
│   ├── data.ts          # Data services, API calls, utility functions
│   └── dummyData.ts     # Initial seed data for first-time use
├── App.tsx              # Main app component with navigation
├── index.html           # HTML entry point
├── index.tsx            # React root renderer
├── metadata.json        # Application metadata
├── types.ts             # TypeScript type definitions
└── README.md            # This file
```
