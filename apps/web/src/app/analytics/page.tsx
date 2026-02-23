'use client';

import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
  ComposedChart,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Clock, Users, Building2, Download, FileText, AlertCircle, FileSpreadsheet, Image, Archive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const PERIOD_PRESETS = [
  { value: 'CURRENT_YEAR', label: 'Ano atual' },
  { value: 'LAST_YEAR', label: 'Ano anterior' },
  { value: 'LAST_30', label: 'Últimos 30 dias' },
  { value: 'LAST_3_MONTHS', label: 'Últimos 3 meses' },
  { value: 'THIS_MONTH', label: 'Este mês' },
  { value: 'CUSTOM', label: 'Intervalo personalizado' },
] as const;

type PeriodPreset = (typeof PERIOD_PRESETS)[number]['value'];

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateRangeFromPreset(
  preset: PeriodPreset,
  customStart: string,
  customEnd: string
): { startDate: string; endDate: string } {
  const now = new Date();
  const today = toYYYYMMDD(now);

  switch (preset) {
    case 'CURRENT_YEAR':
      return { startDate: `${now.getFullYear()}-01-01`, endDate: `${now.getFullYear()}-12-31` };
    case 'LAST_YEAR':
      const lastYear = now.getFullYear() - 1;
      return { startDate: `${lastYear}-01-01`, endDate: `${lastYear}-12-31` };
    case 'LAST_30': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { startDate: toYYYYMMDD(start), endDate: today };
    }
    case 'LAST_3_MONTHS': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      return { startDate: toYYYYMMDD(start), endDate: today };
    }
    case 'THIS_MONTH':
      return {
        startDate: toYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: today,
      };
    case 'CUSTOM':
    default:
      return { startDate: customStart || today, endDate: customEnd || today };
  }
}

const VIEW_MODE_LABELS: Record<string, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
};

// Blue gradient palette (light to dark)
const BLUE_SHADES = [
  '#eff6ff', // 50
  '#dbeafe', // 100
  '#bfdbfe', // 200
  '#93c5fd', // 300
  '#60a5fa', // 400
  '#3b82f6', // 500
  '#2563eb', // 600
  '#1d4ed8', // 700
  '#1e40af', // 800
  '#1e3a8a', // 900
];
const BLUE_PRIMARY = '#3b82f6';
const BLUE_LIGHT = '#93c5fd';
const BLUE_DARK = '#1e40af';

const TOP_N_OPTIONS = [5, 10, 15, 20] as const;

export default function AnalyticsPage() {
  const now = new Date();
  const today = toYYYYMMDD(now);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('CURRENT_YEAR');
  const [customStartDate, setCustomStartDate] = useState<string>(() => `${now.getFullYear()}-01-01`);
  const [customEndDate, setCustomEndDate] = useState<string>(() => today);
  const [viewMode, setViewMode] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');
  const [topN, setTopN] = useState<number>(10);

  const { startDate, endDate } = useMemo(
    () => getDateRangeFromPreset(periodPreset, customStartDate, customEndDate),
    [periodPreset, customStartDate, customEndDate]
  );

  const dateRangeValid = startDate <= endDate;
  const rangeDays = dateRangeValid
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const rangeTooLarge = dateRangeValid && rangeDays > 730; // > 2 years

  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics', startDate, endDate, viewMode],
    queryFn: () => api.getTicketAnalytics({ startDate, endDate, viewMode }),
    enabled: dateRangeValid,
  });

  // Calculate KPI metrics
  const avgResolutionTime = analytics?.averageResolutionTime || 0;
  const avgTimePerPerson = analytics?.averagePerPerson && analytics.averagePerPerson.length > 0
    ? analytics.averagePerPerson.reduce((sum: number, p: { name: string; averageTime: number }) => sum + (p.averageTime || 0), 0) / analytics.averagePerPerson.length
    : 0;
  const avgTimePerDept = analytics?.averagePerDepartment && analytics.averagePerDepartment.length > 0
    ? analytics.averagePerDepartment.reduce((sum: number, d: { name: string; averageTime: number }) => sum + (d.averageTime || 0), 0) / analytics.averagePerDepartment.length
    : 0;

  // Calculate total tickets
  const totalTickets = analytics?.general?.reduce((sum: number, item: { period: string; count: number }) => sum + (item.count || 0), 0) || 0;

  // Prepare data for charts (use topN for person charts)
  const ticketsOverTime = analytics?.general || [];
  const ticketsByPerson = analytics?.byPerson?.slice(0, topN) || [];
  const ticketsByDepartment = analytics?.byDepartment || [];
  const avgTimeByPerson = analytics?.averagePerPerson?.slice(0, topN) || [];
  const avgTimeByDepartment = analytics?.averagePerDepartment || [];

  // Calculate department percentages for pie chart
  const totalDeptTickets = ticketsByDepartment.reduce((sum: number, d: { name: string; count: number; averageTime: number }) => sum + (d.count || 0), 0);
  const departmentPieData = ticketsByDepartment.map((dept: { name: string; count: number; averageTime: number }) => ({
    name: dept.name || '',
    value: dept.count || 0,
    percentage: totalDeptTickets > 0 ? Math.round(((dept.count || 0) / totalDeptTickets) * 100) : 0,
  }));

  // Derived data for extra charts
  const topPeriodsByCount = useMemo(() => {
    return [...(ticketsOverTime as { period: string; count: number }[])]
      .sort((a: { period: string; count: number }, b: { period: string; count: number }) => b.count - a.count)
      .slice(0, 8)
      .map((item: { period: string; count: number }) => ({ period: item.period, count: item.count }));
  }, [ticketsOverTime]);

  const agentShareData = useMemo(() => {
    const total = ticketsByPerson.reduce((s: number, p: { name: string; count: number }) => s + (p.count || 0), 0);
    return ticketsByPerson.slice(0, 8).map((p: { name: string; count: number }, i: number) => ({
      name: (p.name || '').length > 10 ? (p.name || '').substring(0, 10) + '…' : (p.name || ''),
      value: p.count || 0,
      percentage: total > 0 ? Math.round(((p.count || 0) / total) * 100) : 0,
      fill: BLUE_SHADES[3 + (i % 7)],
    }));
  }, [ticketsByPerson]);

  const deptCountAndTime = useMemo(() => {
    return (ticketsByDepartment as { name: string; count: number; averageTime: number }[]).map((d: { name: string; count: number; averageTime: number }) => ({
      name: (d.name || '').length > 10 ? (d.name || '').substring(0, 10) + '…' : (d.name || ''),
      count: d.count || 0,
      tempoMedio: Number((Number(d.averageTime) || 0).toFixed(1)),
    }));
  }, [ticketsByDepartment]);

  const formatDateLabel = (value: string | undefined, mode: string) => {
    if (!value) return '';
    try {
      if (mode === 'DAILY') {
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (mode === 'WEEKLY') {
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (mode === 'MONTHLY') {
        const date = new Date(value + '-01');
        if (isNaN(date.getTime())) return value;
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else if (mode === 'BIMONTHLY') {
        return value;
      } else if (mode === 'QUARTERLY') {
        return value;
      } else if (mode === 'YEARLY') {
        return value;
      }
      return value;
    } catch {
      return value;
    }
  };

  const exportToCSV = () => {
    if (!analytics) return;

    const avgByPersonMap = new Map<string, number>();
    (analytics?.averagePerPerson || []).forEach((p: { name: string; averageTime: number }) => {
      avgByPersonMap.set(p.name, p.averageTime);
    });
    const byPersonWithAvg = (analytics?.byPerson || []).map((person: { name: string; count: number }) => ({
      name: person.name || '',
      count: person.count || 0,
      averageTime: avgByPersonMap.get(person.name || '') ?? 0,
    }));

    const csvRows: string[] = [];
    csvRows.push('Relatório de Análises');
    csvRows.push(`Período,${startDate} a ${endDate}`);
    csvRows.push(`Modo de visualização,${VIEW_MODE_LABELS[viewMode] ?? viewMode}`);
    csvRows.push('');

    csvRows.push('Resumo');
    csvRows.push(`Total de tickets,${totalTickets}`);
    csvRows.push(`Tempo médio de resolução (horas),${avgResolutionTime.toFixed(2)}`);
    csvRows.push(`Média por pessoa (horas),${avgTimePerPerson.toFixed(2)}`);
    csvRows.push(`Média por departamento (horas),${avgTimePerDept.toFixed(2)}`);
    csvRows.push('');

    csvRows.push('Tickets ao longo do tempo');
    csvRows.push('Período,Quantidade');
    ticketsOverTime.forEach((item: { period: string; count: number }) => {
      csvRows.push(`${item.period},${item.count}`);
    });
    csvRows.push('');

    csvRows.push('Por pessoa');
    csvRows.push('Nome,Quantidade,Tempo médio (horas)');
    byPersonWithAvg.forEach((person: { name: string; count: number; averageTime: number }) => {
      const personName = person.name || '';
      const escapedName = personName.includes(',') ? `"${personName.replace(/"/g, '""')}"` : personName;
      csvRows.push(`${escapedName},${person.count || 0},${(Number(person.averageTime) || 0).toFixed(2)}`);
    });
    csvRows.push('');

    csvRows.push('Por departamento');
    csvRows.push('Nome,Quantidade,Tempo médio (horas)');
    ticketsByDepartment.forEach((dept: { name: string; count: number; averageTime: number }) => {
      const deptName = dept.name || '';
      const escapedName = deptName.includes(',') ? `"${deptName.replace(/"/g, '""')}"` : deptName;
      csvRows.push(`${escapedName},${dept.count || 0},${(Number(dept.averageTime) || 0).toFixed(2)}`);
    });

    const csvContent = csvRows.join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-report-${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const allChartIds = [
    'tickets-over-time',
    'top-periods',
    'tickets-by-department',
    'agent-share-donut',
    'tickets-by-person',
    'avg-time-by-person',
    'dept-count-time',
    'avg-time-by-department',
  ];

  const exportChartsAsImages = async () => {
    const charts = allChartIds;
    
    for (const chartId of charts) {
      const chartElement = chartRefs.current[chartId];
      if (!chartElement) continue;

      try {
        // Export as SVG
        const svg = chartElement.querySelector('svg');
        if (svg) {
          // Clone the SVG to avoid modifying the original
          const clonedSvg = svg.cloneNode(true) as SVGElement;
          
          // Set background color
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('width', '100%');
          rect.setAttribute('height', '100%');
          rect.setAttribute('fill', 'white');
          clonedSvg.insertBefore(rect, clonedSvg.firstChild);
          
          // Get SVG dimensions
          const bbox = svg.getBBox();
          clonedSvg.setAttribute('width', String(bbox.width + 40));
          clonedSvg.setAttribute('height', String(bbox.height + 40));
          clonedSvg.setAttribute('viewBox', `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`);
          
          const svgData = new XMLSerializer().serializeToString(clonedSvg);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const svgUrl = URL.createObjectURL(svgBlob);
          const link = document.createElement('a');
          link.download = `${chartId}-${startDate}_${endDate}.svg`;
          link.href = svgUrl;
          link.click();
          URL.revokeObjectURL(svgUrl);
          
          // Small delay between exports
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Error exporting ${chartId}:`, error);
      }
    }
  };

  const handleExport = async () => {
    exportToCSV();
    // Wait a bit before exporting images to avoid browser blocking multiple downloads
    setTimeout(async () => {
      await exportChartsAsImages();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Análises</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Relatórios de desempenho da sua equipe</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={exportToCSV}
            disabled={!dateRangeValid || !analytics}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setTimeout(() => exportChartsAsImages(), 0)}
            disabled={!dateRangeValid || !analytics}
          >
            <Image className="h-4 w-4" />
            Exportar Gráficos (SVG)
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                disabled={!dateRangeValid || !analytics}
              >
                <Archive className="h-4 w-4" />
                Exportar Tudo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                CSV + todos os gráficos (SVG)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToCSV}>Apenas CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeout(() => exportChartsAsImages(), 0)}>
                Apenas gráficos SVG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Filtro de Data e Visualização</CardTitle>
          <CardDescription>Selecione o período e o modo de visualização para as análises</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Período</label>
              <Select
                value={periodPreset}
                onValueChange={(value: PeriodPreset) => setPeriodPreset(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_PRESETS.map((p: { value: PeriodPreset; label: string }) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {periodPreset === 'CUSTOM' && (
              <>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Data inicial</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomStartDate(e.target.value)}
                    className="w-full"
                    max={customEndDate || undefined}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Data final</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomEndDate(e.target.value)}
                    className="w-full"
                    min={customStartDate || undefined}
                    max={today}
                  />
                </div>
              </>
            )}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Modo de Visualização</label>
              <Select value={viewMode} onValueChange={(value: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY') => setViewMode(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o modo de visualização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Diário</SelectItem>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                  <SelectItem value="MONTHLY">Mensal</SelectItem>
                  <SelectItem value="BIMONTHLY">Bimestral</SelectItem>
                  <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                  <SelectItem value="YEARLY">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Top N (agentes/dep.)</label>
              <Select value={String(topN)} onValueChange={(v: string) => setTopN(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOP_N_OPTIONS.map((n: number) => (
                    <SelectItem key={n} value={String(n)}>
                      Top {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!dateRangeValid && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              A data inicial deve ser anterior ou igual à data final.
            </div>
          )}
          {rangeTooLarge && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              O período selecionado é maior que 2 anos. A consulta pode demorar mais.
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border hover:border-blue-500/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Tickets</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Tickets resolvidos no período</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:border-blue-500/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média de Tempo de Resolução</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgResolutionTime.toFixed(1)} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Tempo médio de resolução</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:border-blue-500/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média de Tempo por Pessoa</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTimePerPerson.toFixed(1)} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">por membro da equipe</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:border-blue-500/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média de Tempo por Departamento</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTimePerDept.toFixed(1)} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Por departamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      {!dateRangeValid ? (
        <div className="text-center py-12 text-muted-foreground">
          Ajuste o período (data inicial e final) para visualizar os dados.
        </div>
      ) : isLoadingAnalytics ? (
        <div className="text-center py-12 text-muted-foreground">Carregando dados...</div>
      ) : analytics ? (
        <div className="space-y-10">
          {/* Section: Ao longo do tempo */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b pb-2">Ao longo do tempo</h2>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="border-border" ref={(el: HTMLDivElement | null) => { chartRefs.current['tickets-over-time'] = el; }}>
                <CardHeader>
                  <CardTitle className="text-lg">Tickets resolvidos ao longo do tempo</CardTitle>
                  <CardDescription>Volume de tickets por período</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{ resolved: { label: 'Tickets resolvidos', color: BLUE_PRIMARY } }}
                    className="h-[320px] w-full"
                  >
                    <AreaChart data={ticketsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value: string | number) => formatDateLabel(String(value), viewMode)}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={BLUE_PRIMARY}
                        strokeWidth={2}
                        fill={BLUE_PRIMARY}
                        fillOpacity={0.25}
                        name="resolved"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="border-border" ref={(el: HTMLDivElement | null) => { chartRefs.current['top-periods'] = el; }}>
                <CardHeader>
                  <CardTitle className="text-lg">Picos de demanda</CardTitle>
                  <CardDescription>Períodos com mais tickets (top 8)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{ count: { label: 'Tickets', color: BLUE_PRIMARY } }}
                    className="h-[320px] w-full"
                  >
                    <BarChart data={topPeriodsByCount} layout="vertical" margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis
                        type="category"
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={80}
                        tickFormatter={(value: string | number) => formatDateLabel(String(value), viewMode)}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill={BLUE_PRIMARY} radius={[0, 4, 4, 0]} name="count" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section: Distribuição */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b pb-2">Distribuição</h2>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="border-border" ref={(el: HTMLDivElement | null) => { chartRefs.current['tickets-by-department'] = el; }}>
                <CardHeader>
                  <CardTitle className="text-lg">Tickets por Departamento</CardTitle>
                  <CardDescription>Distribuição por departamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={Object.fromEntries(
                      departmentPieData.map((dept: { name: string; value: number; percentage: number }, index: number) => [
                        `dept-${index}`,
                        { label: dept.name || '', color: BLUE_SHADES[4 + (index % 6)] },
                      ])
                    )}
                    className="h-[320px] w-full"
                  >
                    <PieChart>
                      <Pie
                        data={departmentPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name || ''}: ${Math.round((percent ?? 0) * 100)}%`}
                        outerRadius={95}
                        fill={BLUE_PRIMARY}
                        dataKey="value"
                      >
                        {departmentPieData.map((_: { name: string; value: number; percentage: number }, index: number) => (
                          <Cell key={`cell-${index}`} fill={BLUE_SHADES[3 + (index % 7)]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="border-border" ref={(el: HTMLDivElement | null) => { chartRefs.current['agent-share-donut'] = el; }}>
                <CardHeader>
                  <CardTitle className="text-lg">Participação por agente</CardTitle>
                  <CardDescription>Share do total por agente (top 8)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={Object.fromEntries(
                      agentShareData.map((a: { name: string; value: number; percentage: number; fill: string }, i: number) => [`share-${i}`, { label: a.name || '', color: a.fill }])
                    )}
                    className="h-[320px] w-full"
                  >
                    <PieChart>
                      <Pie
                        data={agentShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name || ''}: ${Math.round((percent ?? 0) * 100)}%`}
                        labelLine={false}
                      >
                        {agentShareData.map((entry: { name: string; value: number; percentage: number; fill: string }, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section: Por agente */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b pb-2">Por agente</h2>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="border-border" ref={(el: HTMLDivElement | null) => { chartRefs.current['tickets-by-person'] = el; }}>
                <CardHeader>
                  <CardTitle className="text-lg">Tickets por Agente</CardTitle>
                  <CardDescription>Quantidade (top {topN})</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={Object.fromEntries(
                      ticketsByPerson.map((person: { name: string; count: number }, index: number) => [
                        `person-${index}`,
                        { label: person.name || '', color: BLUE_SHADES[4 + (index % 6)] },
                      ])
                    )}
                    className="h-[320px] w-full"
                  >
                    <BarChart
                      data={ticketsByPerson.map((person: { name: string; count: number }) => ({
                        name: (person.name || '').length > 15 ? (person.name || '').substring(0, 15) + '…' : (person.name || ''),
                        count: person.count || 0,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill={BLUE_PRIMARY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="border-border" ref={(el: HTMLDivElement | null) => { chartRefs.current['avg-time-by-person'] = el; }}>
                <CardHeader>
                  <CardTitle className="text-lg">Tempo médio de resolução por Agente</CardTitle>
                  <CardDescription>Horas médias (top {topN})</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={Object.fromEntries(
                      avgTimeByPerson.map((person: { name: string; averageTime: number }, index: number) => [
                        `avg-person-${index}`,
                        { label: person.name || '', color: BLUE_SHADES[4 + (index % 6)] },
                      ])
                    )}
                    className="h-[320px] w-full"
                  >
                    <BarChart
                      data={avgTimeByPerson.map((person: { name: string; averageTime: number }) => ({
                        name: (person.name || '').length > 15 ? (person.name || '').substring(0, 15) + '…' : (person.name || ''),
                        time: Number((Number(person.averageTime) || 0).toFixed(1)),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        label={{ value: 'Horas', angle: -90, position: 'insideLeft' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="time" fill={BLUE_DARK} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section: Por departamento */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b pb-2">Por departamento</h2>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="border-border lg:col-span-2" ref={(el: HTMLDivElement | null) => { chartRefs.current['dept-count-time'] = el; }}>
                <CardHeader>
                  <CardTitle className="text-lg">Departamentos: quantidade e tempo médio</CardTitle>
                  <CardDescription>Barras = tickets (esq.) e horas médias (dir.)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: { label: 'Tickets', color: BLUE_LIGHT },
                      tempoMedio: { label: 'Tempo médio (h)', color: BLUE_DARK },
                    }}
                    className="h-[320px] w-full"
                  >
                    <ComposedChart data={deptCountAndTime} margin={{ right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        label={{ value: 'Tickets', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        label={{ value: 'Horas', angle: 90, position: 'insideRight' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar yAxisId="left" dataKey="count" fill={BLUE_LIGHT} radius={[4, 4, 0, 0]} name="Tickets" />
                      <Bar
                        yAxisId="right"
                        dataKey="tempoMedio"
                        fill={BLUE_DARK}
                        radius={[4, 4, 0, 0]}
                        name="Tempo médio (h)"
                      />
                      <Legend />
                    </ComposedChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="border-border lg:col-span-2" ref={(el: HTMLDivElement | null) => { chartRefs.current['avg-time-by-department'] = el; }}>
                <CardHeader>
                  <CardTitle className="text-lg">Tempo médio de resolução por Departamento</CardTitle>
                  <CardDescription>Horas médias por departamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={Object.fromEntries(
                      avgTimeByDepartment.map((d: { name: string; averageTime: number }, index: number) => [
                        `avg-dept-${index}`,
                        { label: d.name || '', color: BLUE_SHADES[4 + (index % 6)] },
                      ])
                    )}
                    className="h-[320px] w-full"
                  >
                    <BarChart
                      data={avgTimeByDepartment.map((d: { name: string; averageTime: number }) => ({
                        name: (d.name || '').length > 12 ? (d.name || '').substring(0, 12) + '…' : (d.name || ''),
                        time: Number((Number(d.averageTime) || 0).toFixed(1)),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        label={{ value: 'Horas', angle: -90, position: 'insideLeft' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="time" fill={BLUE_DARK} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">No analytics data available</div>
      )}
    </div>
  );
}
