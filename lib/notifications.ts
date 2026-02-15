import { createEdgeAdminClient } from './supabase/edge';

export interface NotificationPayload {
    propertyId: string;
    type: 'EMERGENCY_HALT' | 'COST_ANOMALY';
    reason: string;
    details?: any;
}

/**
 * Service to handle mandatory notifications for property owners.
 */
export class NotificationService {
    /**
     * Sends an emergency halt notification to the property owner.
     */
    static async notifyEmergencyHalt(payload: NotificationPayload) {
        const supabase = createEdgeAdminClient();
        
        try {
            // 1. Get property and owner details
            // Note: In this project's schema, owner info is typically tied to the tenant
            const { data: property, error: propError } = await supabase
                .from('properties')
                .select('name, tenant_id')
                .eq('id', payload.propertyId)
                .single();

            if (propError || !property) {
                console.error('[NOTIFY] Property lookup failed:', propError?.message);
                return;
            }

            // 2. Log to suspicious_activities for audit trail and dashboard visibility
            await supabase.from('suspicious_activities').insert({
                property_id: payload.propertyId,
                activity_type: payload.type,
                details: {
                    ...payload.details,
                    reason: payload.reason,
                    propertyName: property.name,
                    timestamp: new Date().toISOString()
                },
                severity: 'critical'
            });

            // 3. Trigger Email/SMS (Mocked for now as per plan, but structured for production)
            console.log(`[NOTIFY] 🚨 EMERGENCY ALERT for "${property.name}" (${payload.propertyId})`);
            console.log(`[NOTIFY] Reason: ${payload.reason}`);
            console.log(`[NOTIFY] Duration: 60 minutes (Auto-cooldown)`);
            
            // TODO: Integrate with SendGrid/Twilio hook here
            // await this.sendEmail(property.owner_email, ...);
            
            return { success: true };
        } catch (err) {
            console.error('[NOTIFY] Failed to send notification:', err);
            return { success: false, error: err };
        }
    }
}
