'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Clock, Users, Building2, TrendingUp, TrendingDown, Download } from 'lucide-react';

export default function AnalyticsPage() {
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'YEAR' | 'SEMIANNUAL' | 'BIMONTHLY' | 'MONTHLY'>('MONTHLY');

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics', analyticsPeriod],
    queryFn: () => api.getTicketAnalytics(analyticsPeriod),
  });

  // Calculate KPI metrics with comparison (simplified - in real app, compare with previous period)
  const avgResolutionTime = analytics?.averageResolutionTime || 0;
  const avgTimePerPerson = analytics?.averagePerPerson && analytics.averagePerPerson.length > 0
    ? analytics.averagePerPerson.reduce((sum: number, p: any) => sum + p.averageTime, 0) / analytics.averagePerPerson.length
    : 0;
  const avgTimePerDept = analytics?.averagePerDepartment && analytics.averagePerDepartment.length > 0
    ? analytics.averagePerDepartment.reduce((sum: number, d: any) => sum + d.averageTime, 0) / analytics.averagePerDepartment.length
    : 0;

  // Prepare data for charts
  const ticketsOverTime = analytics?.general || [];
  const ticketsByPerson = analytics?.byPerson?.slice(0, 5) || [];
  const ticketsByDepartment = analytics?.byDepartment || [];
  const avgTimeByPerson = analytics?.averagePerPerson?.slice(0, 5) || [];

  // Calculate department percentages for pie chart
  const totalDeptTickets = ticketsByDepartment.reduce((sum: number, d: any) => sum + d.count, 0);
  const departmentPieData = ticketsByDepartment.map((dept: any) => ({
    name: dept.name,
    value: dept.count,
    percentage: totalDeptTickets > 0 ? Math.round((dept.count / totalDeptTickets) * 100) : 0,
  }));

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const periodLabel = analyticsPeriod === 'YEAR' ? 'Last 12 months' 
    : analyticsPeriod === 'SEMIANNUAL' ? 'Last 6 months'
    : analyticsPeriod === 'BIMONTHLY' ? 'Last 2 months'
    : 'Last 30 days';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Performance insights for your support team</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={analyticsPeriod} onValueChange={(value: 'YEAR' | 'SEMIANNUAL' | 'BIMONTHLY' | 'MONTHLY') => setAnalyticsPeriod(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="YEAR">Year</SelectItem>
              <SelectItem value="SEMIANNUAL">Semiannual</SelectItem>
              <SelectItem value="BIMONTHLY">Bimonthly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Resolution Time</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgResolutionTime.toFixed(1)} hrs</div>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>12% faster vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Time per Person</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTimePerPerson.toFixed(1)} hrs</div>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 mt-1">
              <TrendingDown className="h-3 w-3" />
              <span>8% improvement vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Time per Department</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTimePerDept.toFixed(1)} hrs</div>
            <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>5% slower vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      {isLoadingAnalytics ? (
        <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
      ) : analytics ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Tickets Answered Over Time - Line Chart */}
          <Card className="border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Tickets Answered Over Time</CardTitle>
              <CardDescription>Monthly ticket volume and resolution trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  resolved: {
                    label: "Tickets Resolved",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[350px] w-full"
              >
                <LineChart data={ticketsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      if (analyticsPeriod === 'MONTHLY') {
                        return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }
                      return new Date(value + '-01').toLocaleDateString('en-US', { month: 'short' });
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="resolved"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Tickets Handled by Department - Pie Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Tickets Handled by Department</CardTitle>
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
                    label={({ name, percentage }) => `${name} ${percentage}%`}
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
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Tickets Answered by Person</CardTitle>
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
                    name: person.name.length > 20 ? person.name.substring(0, 20) + '...' : person.name,
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
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Average Resolution Time per Person */}
          <Card className="border-border/50 lg:col-span-2">
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
                    name: person.name.length > 20 ? person.name.substring(0, 20) + '...' : person.name,
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
                  <Bar dataKey="time" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
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
