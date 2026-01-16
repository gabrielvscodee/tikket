'use client';

import { useState, useRef } from 'react';
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
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Clock, Users, Building2, TrendingUp, Download, Calendar, FileText } from 'lucide-react';

export default function AnalyticsPage() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [startDate, setStartDate] = useState<string>(lastMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(now.toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics', startDate, endDate, viewMode],
    queryFn: () => api.getTicketAnalytics({
      startDate,
      endDate,
      viewMode,
    }),
  });

  // Calculate KPI metrics
  const avgResolutionTime = analytics?.averageResolutionTime || 0;
  const avgTimePerPerson = analytics?.averagePerPerson && analytics.averagePerPerson.length > 0
    ? analytics.averagePerPerson.reduce((sum: number, p: any) => sum + p.averageTime, 0) / analytics.averagePerPerson.length
    : 0;
  const avgTimePerDept = analytics?.averagePerDepartment && analytics.averagePerDepartment.length > 0
    ? analytics.averagePerDepartment.reduce((sum: number, d: any) => sum + d.averageTime, 0) / analytics.averagePerDepartment.length
    : 0;

  // Calculate total tickets
  const totalTickets = analytics?.general?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;

  // Prepare data for charts
  const ticketsOverTime = analytics?.general || [];
  const ticketsByPerson = analytics?.byPerson?.slice(0, 10) || [];
  const ticketsByDepartment = analytics?.byDepartment || [];
  const avgTimeByPerson = analytics?.averagePerPerson?.slice(0, 10) || [];

  // Calculate department percentages for pie chart
  const totalDeptTickets = ticketsByDepartment.reduce((sum: number, d: any) => sum + d.count, 0);
  const departmentPieData = ticketsByDepartment.map((dept: any) => ({
    name: dept.name,
    value: dept.count,
    percentage: totalDeptTickets > 0 ? Math.round((dept.count / totalDeptTickets) * 100) : 0,
  }));

  // Color palette for charts
  const COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#6366f1', // Indigo
  ];

  const formatDateLabel = (value: string, mode: string) => {
    try {
      if (mode === 'DAILY') {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (mode === 'WEEKLY') {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (mode === 'MONTHLY') {
        const date = new Date(value + '-01');
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

    const csvRows: string[] = [];
    
    // Header
    csvRows.push('Analytics Report');
    csvRows.push(`Date Range: ${startDate} to ${endDate}`);
    csvRows.push(`View Mode: ${viewMode}`);
    csvRows.push('');
    
    // Summary
    csvRows.push('Summary');
    csvRows.push(`Total Tickets,${totalTickets}`);
    csvRows.push(`Average Resolution Time (hours),${avgResolutionTime.toFixed(2)}`);
    csvRows.push(`Average Time per Person (hours),${avgTimePerPerson.toFixed(2)}`);
    csvRows.push(`Average Time per Department (hours),${avgTimePerDept.toFixed(2)}`);
    csvRows.push('');
    
    // Tickets Over Time
    csvRows.push('Tickets Over Time');
    csvRows.push('Period,Count');
    ticketsOverTime.forEach((item: any) => {
      csvRows.push(`${item.period},${item.count}`);
    });
    csvRows.push('');
    
    // By Person
    csvRows.push('Tickets by Person');
    csvRows.push('Name,Count,Average Time (hours)');
    ticketsByPerson.forEach((person: any) => {
      csvRows.push(`${person.name},${person.count},${person.averageTime.toFixed(2)}`);
    });
    csvRows.push('');
    
    // By Department
    csvRows.push('Tickets by Department');
    csvRows.push('Name,Count,Average Time (hours)');
    ticketsByDepartment.forEach((dept: any) => {
      csvRows.push(`${dept.name},${dept.count},${dept.averageTime.toFixed(2)}`);
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-report-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportChartsAsImages = async () => {
    const charts = ['tickets-over-time', 'tickets-by-department', 'tickets-by-person', 'avg-time-by-person'];
    
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
          link.download = `${chartId}-${startDate}-to-${endDate}.svg`;
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
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Performance insights for your support team</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Date Range & View Settings</CardTitle>
          <CardDescription>Select the date range and view mode for analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
                max={endDate}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
                min={startDate}
                max={now.toISOString().split('T')[0]}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">View Mode</label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select view mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="BIMONTHLY">Bi-Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {useCustomDateRange && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  setStartDate(weekAgo.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                  setViewMode('DAILY');
                }}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setMonth(today.getMonth() - 1);
                  setStartDate(monthAgo.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                  setViewMode('DAILY');
                }}
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const threeMonthsAgo = new Date(today);
                  threeMonthsAgo.setMonth(today.getMonth() - 3);
                  setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                  setViewMode('WEEKLY');
                }}
              >
                Last 3 Months
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const yearAgo = new Date(today);
                  yearAgo.setFullYear(today.getFullYear() - 1);
                  setStartDate(yearAgo.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                  setViewMode('MONTHLY');
                }}
              >
                Last Year
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Resolved tickets in period</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Resolution Time</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgResolutionTime.toFixed(1)} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Average time to resolve</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Time per Person</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTimePerPerson.toFixed(1)} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Per team member</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Time per Department</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTimePerDept.toFixed(1)} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Per department</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      {isLoadingAnalytics ? (
        <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
      ) : analytics ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Tickets Answered Over Time - Area Chart */}
          <Card className="border-border/50 lg:col-span-2" ref={(el) => (chartRefs.current['tickets-over-time'] = el)}>
            <CardHeader>
              <CardTitle className="text-lg">Tickets Resolved Over Time</CardTitle>
              <CardDescription>Ticket volume and resolution trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  resolved: {
                    label: "Tickets Resolved",
                    color: "#3b82f6",
                  },
                }}
                className="h-[350px] w-full"
              >
                <AreaChart data={ticketsOverTime}>
                  <defs>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => formatDateLabel(value, viewMode)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorResolved)"
                    name="resolved"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Tickets Handled by Department - Pie Chart */}
          <Card className="border-border/50" ref={(el) => (chartRefs.current['tickets-by-department'] = el)}>
            <CardHeader>
              <CardTitle className="text-lg">Tickets by Department</CardTitle>
              <CardDescription>Distribution of ticket volume across teams</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={Object.fromEntries(
                  departmentPieData.map((dept: any, index: number) => [
                    `dept-${index}`,
                    {
                      label: dept.name,
                      color: COLORS[index % COLORS.length],
                    },
                  ])
                )}
                className="h-[350px] w-full"
              >
                <PieChart>
                  <Pie
                    data={departmentPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentPieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Tickets Answered by Person */}
          <Card className="border-border/50" ref={(el) => (chartRefs.current['tickets-by-person'] = el)}>
            <CardHeader>
              <CardTitle className="text-lg">Tickets by Person</CardTitle>
              <CardDescription>Individual team member performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={Object.fromEntries(
                  ticketsByPerson.map((person: any, index: number) => [
                    `person-${index}`,
                    {
                      label: person.name,
                      color: COLORS[index % COLORS.length],
                    },
                  ])
                )}
                className="h-[350px] w-full"
              >
                <BarChart
                  data={ticketsByPerson.map((person: any) => ({
                    name: person.name.length > 15 ? person.name.substring(0, 15) + '...' : person.name,
                    count: person.count,
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
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Average Resolution Time per Person */}
          <Card className="border-border/50 lg:col-span-2" ref={(el) => (chartRefs.current['avg-time-by-person'] = el)}>
            <CardHeader>
              <CardTitle className="text-lg">Average Resolution Time per Person</CardTitle>
              <CardDescription>Average hours to resolve tickets by team member</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={Object.fromEntries(
                  avgTimeByPerson.map((person: any, index: number) => [
                    `avg-person-${index}`,
                    {
                      label: person.name,
                      color: COLORS[index % COLORS.length],
                    },
                  ])
                )}
                className="h-[350px] w-full"
              >
                <BarChart
                  data={avgTimeByPerson.map((person: any) => ({
                    name: person.name.length > 15 ? person.name.substring(0, 15) + '...' : person.name,
                    time: Number(person.averageTime.toFixed(1)),
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
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="time" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">No analytics data available</div>
      )}
    </div>
  );
}
