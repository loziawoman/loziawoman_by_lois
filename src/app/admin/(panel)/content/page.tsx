import type { Metadata } from 'next';
import { HomepageGroup, PolicyEditor, ReviewSettingsGroup, ShippingGroup, SimpleGroup, SizeGuideEditor, SiteImagesGroup } from '@/components/admin/settings-forms';
import { PageHeader } from '@/components/admin/ui';
import { loadAdminSettings } from '@/lib/admin/queries';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Content & settings' };

export default async function ContentPage() {
  const { supabase } = await requirePermission('settings:write');
  const { settings: s, bank } = await loadAdminSettings(supabase);
  const missing = [
    !s.contactEmail && 'contact email', !s.whatsappNumber && 'WhatsApp number', !bank.configured && 'bank details',
    s.shippingRates.placeholder && 'delivery prices', s.policies.returns.isPlaceholder && 'returns policy',
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Content & settings" description="Everything customers read that is not a product. Nothing here is a secret except the bank details, which are only shown to customers holding their own order link." />
      {missing.length > 0 && (
        <p role="note" className="mb-8 border border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 p-4 text-sm" data-testid="notice-setup-incomplete">
          Still to fill in before launch: <strong>{missing.join(', ')}</strong>.
        </p>
      )}
      <SimpleGroup title="Brand and contact" fields={[
        { key: 'brand_name', label: 'Brand name' }, { key: 'tagline', label: 'Tagline' },
        { key: 'contact_email', label: 'Contact email' },
        { key: 'whatsapp_number', label: 'WhatsApp number', hint: 'Digits only with country code, no + sign. Leave empty until you have the real number.' },
        { key: 'whatsapp_message', label: 'WhatsApp prefilled message', kind: 'textarea' },
        { key: 'instagram_url', label: 'Instagram link (https://…)' }, { key: 'tiktok_url', label: 'TikTok link (https://…)' },
        { key: 'studio_location', label: 'Studio location (shown if filled)' }, { key: 'studio_hours', label: 'Studio hours (shown if filled)' },
      ]} values={{ brand_name: s.brandName, tagline: s.tagline, contact_email: s.contactEmail, whatsapp_number: s.whatsappNumber, whatsapp_message: s.whatsappMessage, instagram_url: s.instagramUrl, tiktok_url: s.tiktokUrl, studio_location: s.studioLocation, studio_hours: s.studioHours }} />
      <SimpleGroup title="Bank transfer details" note="Shown to a customer only on their own order page after they place an order." fields={[
        { key: 'bank_name', label: 'Bank name' }, { key: 'bank_account_name', label: 'Account name' }, { key: 'bank_account_number', label: 'Account number' },
      ]} values={{ bank_name: bank.bankName, bank_account_name: bank.accountName, bank_account_number: bank.accountNumber }} />
      <ShippingGroup rates={s.shippingRates} reservationHours={s.reservationHours} />
      <HomepageGroup homepage={s.homepage} aboutStory={s.aboutStory} />
      <ReviewSettingsGroup enabled={s.reviewSubmissionEnabled} />
      <SiteImagesGroup images={s.siteImages} />
      <PolicyEditor settingKey="policy_shipping" policy={s.policies.shipping} />
      <PolicyEditor settingKey="policy_returns" policy={s.policies.returns} />
      <PolicyEditor settingKey="policy_privacy" policy={s.policies.privacy} />
      <PolicyEditor settingKey="policy_terms" policy={s.policies.terms} />
      <SizeGuideEditor guide={s.sizeGuide} />
    </>
  );
}
