import 'server-only';

import { z } from 'zod';
import { UnauthorizedError } from '../auth';
import { fieldErrors } from '../validation';

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fields?: Record<string, string> };

interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string;
}

/** Converte erros do Postgres/PostgREST em mensagens úteis para o painel. */
export function dbErrorMessage(error: PostgrestLikeError): string {
  switch (error.code) {
    case '23505':
      if (error.message?.includes('slug')) return 'Já existe um registo com este slug (URL). Escolha outro.';
      if (error.message?.includes('sku')) return 'Já existe uma variante com este SKU.';
      if (error.message?.includes('product_variants_unique_option')) return 'Existem variantes duplicadas (mesmo tamanho e cor).';
      return 'Registo duplicado.';
    case '23503':
      return 'Este registo está associado a outros dados e não pode ser removido.';
    case '23514':
      return 'Algum valor não cumpre as regras de validação.';
    case '42501':
      return 'Sem permissão para esta operação.';
    case 'P0001':
      return error.message ?? 'Operação recusada.';
    default:
      return 'Erro ao gravar na base de dados. Tente novamente.';
  }
}

/**
 * Envolve uma Server Action: autenticação, validação e erros tratados
 * de forma uniforme — o cliente recebe sempre um ActionResult.
 */
export async function safeAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: error.message };
    if (error instanceof z.ZodError) {
      return { ok: false, error: 'Verifique os campos assinalados.', fields: fieldErrors(error) };
    }
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('[admin action] db', error);
      return { ok: false, error: dbErrorMessage(error as PostgrestLikeError) };
    }
    console.error('[admin action]', error);
    return { ok: false, error: 'Ocorreu um erro inesperado.' };
  }
}
