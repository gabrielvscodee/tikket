import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export function formatPriority(priority: string): string {
  return PRIORITY_LABELS[priority] ?? priority
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  WAITING_REQUESTER: 'Aguardando solicitante',
  WAITING_AGENT: 'Aguardando agente',
  ON_HOLD: 'Em espera',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
}

export function formatStatus(status: string): string {
  const key = (status || '').replace(/ /g, '_')
  return STATUS_LABELS[key] ?? status
}
