/**
 * Utility formatters for Indonesian Rupiah, dates, and WhatsApp templates
 */

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function formatDateIndo(dateStr: string, withDay: boolean = true): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    if (withDay) {
      options.weekday = 'long';
    }
    return new Intl.DateTimeFormat('id-ID', options).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function generateWhatsAppMessage(params: {
  namaMajlis: string;
  namaAnggota: string;
  idAnggota: string;
  jenisTransaksi: string;
  jumlah: number;
  saldoSetelah: number;
  tanggal: string;
  program?: string;
  bendahara: string;
  idTransaksi: string;
}): string {
  const jenisText =
    params.jenisTransaksi === 'setor'
      ? 'SETORAN TABUNGAN'
      : params.jenisTransaksi === 'tarik'
      ? 'PENARIKAN TABUNGAN'
      : 'REFUND DANA';

  return `*BUKTI ${jenisText} - ${params.namaMajlis.toUpperCase()}*
---------------------------------------
No. Transaksi : *${params.idTransaksi}*
Tanggal       : ${formatDateIndo(params.tanggal, false)}
Nama Jamaah   : *${params.namaAnggota}* (${params.idAnggota})

Jenis         : *${jenisText}*
Jumlah        : *${formatRupiah(params.jumlah)}*
Program/Ket.  : ${params.program || 'Tabungan Fleksibel'}
---------------------------------------
*SISA SALDO TABUNGAN*: *${formatRupiah(params.saldoSetelah)}*
---------------------------------------
Dicatat Oleh  : ${params.bendahara} (Bendahara)
_Jazakumullahu khairan katsiran. Semoga berkah dan dimudahkan niat ibadahnya._`;
}
