'use server';

import { revalidatePath } from 'next/cache';
import { safeAction, type ActionResult } from '@/lib/admin/action';
import { requireAdmin } from '@/lib/auth';
import { orderUpdateSchema } from '@/lib/validation';

/**
 * Atualiza estado/notas. Preços e itens são imutáveis (privilégios por coluna).
 * O trigger na base de dados abate/repõe stock conforme o novo estado.
 */
export async function updateOrder(input: { id: string; status: string; admin_notes: string | null }): Promise<ActionResult> {
  return safeAction(async () => {
    const { supabase } = await requireAdmin();
    const { id, status, admin_notes } = orderUpdateSchema.parse(input);
    const { error } = await supabase.from('orders').update({ status, admin_notes }).eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/pedidos');
    revalidatePath(`/admin/pedidos/${id}`);
    revalidatePath('/admin');
    // O stock pode ter mudado: atualiza a vitrine.
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Pedido atualizado.' };
  });
}
