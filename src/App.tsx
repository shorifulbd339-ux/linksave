import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from './components/layout/AppShell';
import { useActivities } from './hooks/useActivities';
import { useAuth } from './hooks/useAuth';
import { useLinks } from './hooks/useLinks';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useTheme } from './hooks/useTheme';
import { BackupRestorePage } from './pages/BackupRestorePage';
import { BulkPastePage } from './pages/BulkPastePage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { LinksCategoryPage } from './pages/LinksCategoryPage';
import { LoginPage } from './pages/LoginPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { SettingsPage } from './pages/SettingsPage';

function AuthenticatedApp() {
  const {
    user,
    loading: authLoading,
    signingIn,
    error: authError,
    clearError: clearAuthError,
    signIn,
    unlockWithPasscode,
    signOut,
  } = useAuth();
  const {
    links,
    loading: linksLoading,
    error: linksError,
    clearError: clearLinksError,
    fromCache,
    hasPendingWrites,
    categoryCounts,
    existingNormalizedSet,
    createBulkLinks,
    editLink,
    removeLink,
    removeBulkLinks,
    copySingleLink,
    copySelectedLinks,
  } = useLinks(user?.uid);
  const {
    activities,
    loading: activitiesLoading,
    clearHistory,
  } = useActivities(user?.uid);
  const isOnline = useNetworkStatus();
  const { theme, setTheme, toggleTheme } = useTheme();
  const {
    canInstall,
    isInstalled,
    isDismissed,
    promptInstall,
    dismissBanner,
  } = usePwaInstall();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-content">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-xs font-medium text-content-secondary">Loading LinkVault...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              signingIn={signingIn}
              error={authError}
              onSignIn={signIn}
              onUnlockPasscode={unlockWithPasscode}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell
      user={user}
      categoryCounts={categoryCounts}
      totalCount={links.length}
      existingNormalizedSet={existingNormalizedSet}
      isOnline={isOnline}
      fromCache={fromCache}
      hasPendingWrites={hasPendingWrites}
      syncError={linksError || authError}
      onDismissSyncError={() => {
        clearLinksError();
        clearAuthError();
      }}
      canInstallPwa={canInstall}
      pwaDismissed={isDismissed}
      onInstallPwa={() => {
        void promptInstall();
      }}
      onDismissPwa={dismissBanner}
      onToggleTheme={toggleTheme}
      onSignOut={signOut}
      onCreateBulkLinks={createBulkLinks}
    >
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              links={links}
              loading={linksLoading}
              categoryCounts={categoryCounts}
              onCopySingle={copySingleLink}
              onCopyBulk={copySelectedLinks}
              onEditLink={editLink}
              onDeleteLink={removeLink}
              onDeleteBulk={removeBulkLinks}
              onCreateBulk={createBulkLinks}
            />
          }
        />
        <Route
          path="/category/:platform"
          element={
            <LinksCategoryPage
              links={links}
              onCopySingle={copySingleLink}
              onCopyBulk={copySelectedLinks}
              onEditLink={editLink}
              onDeleteLink={removeLink}
              onDeleteBulk={removeBulkLinks}
            />
          }
        />
        <Route
          path="/bulk-paste"
          element={
            <BulkPastePage
              existingNormalizedSet={existingNormalizedSet}
              onSaveBulk={createBulkLinks}
            />
          }
        />
        <Route
          path="/search"
          element={
            <SearchResultsPage
              links={links}
              onCopySingle={copySingleLink}
              onCopyBulk={copySelectedLinks}
              onEditLink={editLink}
              onDeleteLink={removeLink}
              onDeleteBulk={removeBulkLinks}
            />
          }
        />
        <Route
          path="/history"
          element={
            <HistoryPage
              activities={activities}
              loading={activitiesLoading}
              onClearHistory={clearHistory}
            />
          }
        />
        <Route
          path="/backup"
          element={
            <BackupRestorePage
              userId={user.uid}
              links={links}
              existingNormalizedSet={existingNormalizedSet}
              onImportLinks={createBulkLinks}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsPage
              user={user}
              links={links}
              theme={theme}
              onThemeChange={setTheme}
              canInstallPwa={canInstall}
              isPwaInstalled={isInstalled}
              onInstallPwa={promptInstall}
              onSignOut={signOut}
              onCreateBulk={createBulkLinks}
              onDeleteBulk={removeBulkLinks}
            />
          }
        />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          className: 'font-sans',
        }}
      />
      <AuthenticatedApp />
    </BrowserRouter>
  );
}

export default App;

