import { fail, handleError, ok } from '@/lib/api/response';
import { getSiteSettings } from '@/lib/settings/queries';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Releases stock held by orders that were never paid. Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`.
 * The window comes from the "reservation hours" site setting.
 */
export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return fail(401, 'unauthenticated', 'Unauthorised.');
    const { reservationHours } = await getSiteSettings();
    const { data, error } = await createSupabaseAdminClient().rpc('release_expired_reservations', { p_hours: reservationHours });
    if (error) throw error;
    return ok({ released: data as number });
  } catch (error) {
    return handleError(error);
  }
}
