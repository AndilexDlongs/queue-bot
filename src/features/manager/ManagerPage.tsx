import React from 'react';
import { LeaveWarningModal } from './components/LeaveWarningModal';
import { ManagerHeader } from './components/ManagerHeader';
import { ManagerIntroCard } from './components/ManagerIntroCard';
import { ManagerNav } from './components/ManagerNav';
import { OperationsSection } from './components/OperationsSection';
import { ProviderManagementSection } from './components/ProviderManagementSection';
import { SalonDetailsSection } from './components/SalonDetailsSection';
import { useManagerState } from './hooks/useManagerState';

const ManagerPage: React.FC = () => {
  const manager = useManagerState();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-sky-50 pb-28">
      <ManagerHeader
        salonName={manager.salon.name}
        activeTab={manager.activeTab}
        barbers={manager.barbers}
        selectedProviderId={manager.selectedProviderId}
        isProviderMenuOpen={manager.isProviderMenuOpen}
        onOpenChatClick={manager.handleOpenChatClick}
        onToggleProviderMenu={manager.handleToggleProviderMenu}
        onSelectProviderFromMenu={manager.handleSelectProviderFromMenu}
      />

      <LeaveWarningModal
        open={manager.showLeaveWarning}
        onClose={manager.handleCloseLeaveWarning}
        onConfirm={manager.handleConfirmOpenChat}
      />

      <div
        className="mx-auto max-w-5xl px-6 py-8 pb-32 animate-rise-in"
        style={{ animationDelay: '120ms' }}
      >
        <ManagerIntroCard activeItem={manager.activeItem} />
        {manager.activeTab === 'salon' && (
          <SalonDetailsSection
            salonForm={manager.salonForm}
            onFieldChange={manager.handleSalonFormChange}
          />
        )}
        {manager.activeTab === 'barbers' && (
          <ProviderManagementSection
            barbers={manager.barbers}
            defaultAddress={manager.defaultAddress}
            openProviderId={manager.openProviderId}
            isEditingProvider={manager.isEditingProvider}
            isCreatingProvider={manager.isCreatingProvider}
            providerDraft={manager.providerDraft}
            deleteConfirmId={manager.deleteConfirmId}
            providerAddresses={manager.providerAddresses}
            onStartCreateProvider={manager.handleStartCreateProvider}
            onCancelCreateProvider={manager.handleCancelCreateProvider}
            onSelectProvider={manager.handleSelectProvider}
            onStartEditingProvider={manager.handleStartEditingProvider}
            onProviderDraftChange={manager.handleProviderDraftChange}
            onSaveProvider={manager.handleSaveProvider}
            onDeleteProvider={manager.handleDeleteProvider}
            onCancelDelete={manager.handleCancelDelete}
            getQueueCount={manager.getQueueCount}
            getServicedCount={manager.getServicedCount}
          />
        )}
        {manager.activeTab === 'operations' && (
          <OperationsSection
            hasProvider={manager.hasProvider}
            isOnDuty={manager.isOnDuty}
            selectedQueue={manager.selectedQueue}
            aliveScale={manager.aliveScale}
            timeLeftMs={manager.timeLeftMs}
            isQueueListOpen={manager.isQueueListOpen}
            isWalkInConfirmOpen={manager.isWalkInConfirmOpen}
            onToggleDuty={manager.handleToggleDuty}
            onToggleQueueList={manager.handleToggleQueueList}
            onToggleWalkInConfirm={manager.handleToggleWalkInConfirm}
            onConfirmWalkIn={manager.handleConfirmWalkIn}
            onCloseWalkInConfirm={manager.handleCloseWalkInConfirm}
            onAlivePing={manager.handleAlivePing}
          />
        )}
      </div>

      <ManagerNav activeTab={manager.activeTab} onSelectTab={manager.handleSelectTab} />
    </div>
  );
};

export default ManagerPage;
