import { createClient } from '@supabase/supabase-js';

// Varsayılan veya localStorage'dan Supabase konfigürasyonunu al
export function getSupabaseConfig() {
  try {
    const saved = localStorage.getItem('as_yapsat_supabase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {}

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  return { url: '', anonKey: '' };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function saveSupabaseConfig({ url, anonKey }) {
  try {
    localStorage.setItem(
      'as_yapsat_supabase_config',
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    );
  } catch {}
}

let clientInstance = null;
let currentConfigHash = '';

export function getSupabase() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  const hash = `${url}_${anonKey}`;
  if (clientInstance && currentConfigHash === hash) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentConfigHash = hash;
    return clientInstance;
  } catch (err) {
    console.error('Supabase istemcisi başlatılamadı:', err);
    return null;
  }
}

// Bağlantı Testi
export async function testSupabaseConnection(customUrl = null, customKey = null) {
  try {
    const url = customUrl || getSupabaseConfig().url;
    const key = customKey || getSupabaseConfig().anonKey;
    if (!url || !key) return { ok: false, error: 'URL ve Anon Key boş olamaz.' };

    const client = createClient(url, key);
    const { data, error } = await client.from('yapsat_sales').select('id').limit(1);
    if (error) throw error;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message || 'Bağlantı kurulamadı.' };
  }
}

// JS camelCase -> DB snake_case Dönüşümü
const toDbSale = (s) => ({
  id: s.id,
  apt_no: s.aptNo,
  customer_name: s.customerName,
  phone: s.phone || '',
  date: s.date || '',
  sale_price_k: s.salePriceK || 0,
  payment_type: s.paymentType || 'installment',
  down_payment_k: s.downPaymentK || 0,
  installment_monthly_k: s.installmentMonthlyK || 0,
  installment_count: s.installmentCount || 0,
  notes: s.notes || '',
  updated_at: s.updatedAt || new Date().toISOString(),
});

// DB snake_case -> JS camelCase Dönüşümü
const fromDbSale = (row) => ({
  id: row.id,
  aptNo: row.apt_no,
  customerName: row.customer_name,
  phone: row.phone || '',
  date: row.date || '',
  salePriceK: Number(row.sale_price_k || 0),
  paymentType: row.payment_type || 'installment',
  downPaymentK: Number(row.down_payment_k || 0),
  installmentMonthlyK: Number(row.installment_monthly_k || 0),
  installmentCount: Number(row.installment_count || 0),
  notes: row.notes || '',
  updatedAt: row.updated_at,
});

// 1. Buluttaki Tüm Satışları Çek
export async function fetchCloudSales() {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('yapsat_sales')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data.map(fromDbSale);
  } catch (err) {
    console.error('Bulut satış kayıtları çekilemedi:', err);
    return null;
  }
}

// 2. Satış Kaydet / Güncelle (Upsert)
export async function upsertCloudSale(sale) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const row = toDbSale(sale);
    const { data, error } = await supabase
      .from('yapsat_sales')
      .upsert(row, { onConflict: 'apt_no' })
      .select()
      .single();

    if (error) throw error;
    return fromDbSale(data);
  } catch (err) {
    console.error('Bulut satış kaydı oluşturulamadı:', err);
    throw err;
  }
}

// 3. Satış Sil
export async function deleteCloudSale(aptNo) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { error } = await supabase
      .from('yapsat_sales')
      .delete()
      .eq('apt_no', aptNo);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Bulut satış kaydı silinemedi:', err);
    throw err;
  }
}

// 4. Baz Fiyatları Çek
export async function fetchCloudBasePrices() {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('yapsat_settings')
      .select('value')
      .eq('key', 'base_prices')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (data?.value && typeof data.value === 'object') {
      return data.value;
    }
    return null;
  } catch (err) {
    console.error('Bulut baz fiyatları çekilemedi:', err);
    return null;
  }
}

// 5. Baz Fiyatları Kaydet
export async function saveCloudBasePrices(prices) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { error } = await supabase
      .from('yapsat_settings')
      .upsert({
        key: 'base_prices',
        value: prices,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Bulut baz fiyatları kaydedilemedi:', err);
    throw err;
  }
}

// 6. Realtime Değişiklik Dinleyicisi (WebSocket)
export function subscribeToCloudChanges(onSalesChange, onPricesChange) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('yapsat_realtime_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'yapsat_sales' },
      () => {
        onSalesChange?.();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'yapsat_settings' },
      (payload) => {
        if (payload.new?.key === 'base_prices') {
          onPricesChange?.(payload.new.value);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
