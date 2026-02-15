import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Phase 15: Admin endpoint for translation cache statistics
 */
export async function GET(req: Request) {
  try {
    // 1. Simple API Key Security
    const authHeader = req.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== adminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createEdgeAdminClient();

    // 2. Fetch stats from database function
    const { data: stats, error } = await supabase.rpc('get_translation_cache_stats');

    if (error) {
      console.error('[STATS] DB Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Return results
    return NextResponse.json({
      success: true,
      stats: stats?.[0] || {},
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[STATS] Server Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
