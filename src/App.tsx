import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { KasirPage } from './pages/KasirPage';
import { AllProductsPage } from './pages/AllProductsPage';
import { ReportsPage } from './pages/ReportsPage';
import { MenuPage } from './pages/MenuPage';
import { SettingsPage } from './pages/SettingsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ShiftPage } from './pages/ShiftPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { BackupPage } from './pages/BackupPage';
import { AboutPage } from './pages/AboutPage';
import { seedInitialData } from './db/seedData';
import { OfflineIndicator } from './components/ui/OfflineIndicator';

export function App() {
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => false);
    seedInitialData();
  }, []);

  return (
    <ThemeProvider>
      <div className="fixed inset-0 w-full h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 select-none transition-colors duration-200">
        <OfflineIndicator />
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                {/* 5 Menu Navigasi Utama */}
                <Route path="/" element={<DashboardPage />} />
                <Route path="/beranda" element={<Navigate to="/" replace />} />
                <Route path="/kasir" element={<KasirPage />} />
                <Route path="/pos" element={<Navigate to="/kasir" replace />} />
                <Route path="/products" element={<AllProductsPage />} />
                <Route path="/laporan" element={<ReportsPage />} />
                <Route path="/reports" element={<Navigate to="/laporan" replace />} />
                <Route path="/menu" element={<MenuPage />} />

                {/* Sub-Halaman Fitur Menu */}
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/shift" element={<ShiftPage />} />
                <Route path="/transactions" element={<TransactionHistoryPage />} />
                <Route path="/backup" element={<BackupPage />} />
                <Route path="/about" element={<AboutPage />} />

                {/* Fallback jika rute tidak ditemukan */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;