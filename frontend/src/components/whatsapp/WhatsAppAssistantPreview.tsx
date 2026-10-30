import React from 'react';
import { WhatsAppDemoAssistant } from './WhatsAppDemoAssistant';

export interface WhatsAppAssistantPreviewProps {
  onClose?: () => void;
  isLiveConfigured?: boolean;
}

/**
 * WhatsAppAssistantPreview
 * 
 * Preserves 100% backward compatibility for existing callers (WhatsAppIntegrationCard, ProfileEditView).
 * Wraps the professional WhatsAppDemoAssistant with all Mission Bharat features,
 * grounded knowledge base, simulated notifications, and demo account linking.
 */
export const WhatsAppAssistantPreview: React.FC<WhatsAppAssistantPreviewProps> = ({
  onClose,
}) => {
  return <WhatsAppDemoAssistant onClose={onClose} isModal={true} />;
};

export { WhatsAppDemoAssistant };
