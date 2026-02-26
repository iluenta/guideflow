import { useState, useCallback } from 'react'
import { ReauthenticationModal } from '@/components/auth/reauthentication-modal'
import { performSensitiveAction } from '@/app/actions/reauthentication'
import { requiresReauthentication } from '@/lib/services/security-policies'
import { isSensitiveAction, type SensitiveAction } from '@/lib/constants/sensitive-actions'
import { useUserProfile } from '@/hooks/use-user-profile'

interface UseSensitiveActionOptions {
  action: string
  onExecute: (reauthToken: string) => Promise<void> | void
}

export function useSensitiveAction({ action, onExecute }: UseSensitiveActionOptions) {
  const [showModal, setShowModal] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const { profile } = useUserProfile()

  const execute = useCallback(async () => {
    // Check if action is sensitive
    if (!isSensitiveAction(action)) {
      // Not a sensitive action, execute directly
      await onExecute('')
      return
    }

    // Check if re-authentication is required
    const requiresReauth = await requiresReauthentication()
    if (!requiresReauth) {
      // Re-authentication not required, execute directly
      await onExecute('')
      return
    }

    // Show modal for re-authentication
    setShowModal(true)
  }, [action, onExecute])

  const handleReauthSuccess = useCallback(async (token: string) => {
    setIsExecuting(true)
    try {
      // Verify token with server
      const result = await performSensitiveAction(action, token)
      
      if (result.success) {
        // Execute the actual action
        await onExecute(token)
      } else {
        throw new Error(result.error || 'Re-autenticación fallida')
      }
    } catch (error) {
      // Error al ejecutar acción sensible - no exponer detalles
      if (process.env.NODE_ENV === 'development') {
        console.error('Error executing sensitive action')
      }
      throw error
    } finally {
      setIsExecuting(false)
    }
  }, [action, onExecute])

  const Modal = profile ? (
    <ReauthenticationModal
      open={showModal}
      onOpenChange={setShowModal}
      action={action as SensitiveAction}
      onSuccess={handleReauthSuccess}
      userEmail={profile.email}
    />
  ) : null

  return {
    execute,
    isExecuting,
    Modal,
  }
}
