'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import {
  Loader2,
  TrendingUp,
  ArrowUpRight,
  Search,
  RefreshCw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Types
interface TrendSignal {
  id: string;
  title: string;
  description: string;
  source: string;
  signalType: string;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  rawData?: any;
}

export default function TrendAnalysis() {
  const [trends, setTrends] = useState<TrendSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');
  const [selectedTrend, setSelectedTrend] = useState<TrendSignal | null>(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call
      const response = await fetch('/api/trends');

      if (response.ok) {
        const data = await response.json();
        setTrends(data);
      } else {
        throw new Error('Failed to fetch trends');
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTrends = async () => {
    try {
      setRefreshing(true);
      // This would trigger the TrendPredictorAgent to look for new trends
      const response = await fetch('/api/agents/trend/predict', {
        method: 'POST',
      });

      if (response.ok) {
        // After the agent runs, fetch the updated trends
        await fetchTrends();
      } else {
        throw new Error('Failed to refresh trends');
      }
    } catch (error) {
      console.error('Error refreshing trends:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and sort trends
  const filteredTrends = trends
    .filter((trend) => {
      const matchesSearch =
        searchQuery === '' ||
        trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trend.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trend.source.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === 'all' || trend.signalType === typeFilter;
      const matchesImpact =
        impactFilter === 'all' || trend.impact === impactFilter;

      return matchesSearch && matchesType && matchesImpact;
    })
    .sort((a, b) => {
      // Sort by date (newest first) and then by impact (higher impact first)
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (dateA !== dateB) return dateB - dateA;

      const impactOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'CRITICAL':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'HIGH':
        return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'LOW':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  const getSignalTypeLabel = (type: string) => {
    switch (type) {
      case 'KEYWORD_TREND':
        return 'Keyword Trend';
      case 'TOPIC_EMERGENCE':
        return 'Emerging Topic';
      case 'SENTIMENT_SHIFT':
        return 'Sentiment Shift';
      case 'COMPETITION_MOVE':
        return 'Competitor Move';
      case 'INDUSTRY_NEWS':
        return 'Industry News';
      case 'REGULATORY_CHANGE':
        return 'Regulatory Change';
      case 'VIRAL_CONTENT':
        return 'Viral Content';
      case 'MARKET_OPPORTUNITY':
        return 'Market Opportunity';
      default:
        return type;
    }
  };

  // Mock data for the empty state
  const mockTrends: TrendSignal[] = [
    {
      id: '1',
      title: 'Rising interest in sustainable marketing',
      description:
        "There's a significant increase in searches and discussions around sustainable marketing practices and eco-friendly brand messaging.",
      source: 'Google Trends Analysis',
      signalType: 'KEYWORD_TREND',
      confidence: 0.87,
      impact: 'HIGH',
      createdAt: '2023-06-04T12:30:00Z',
    },
    {
      id: '2',
      title: 'Competitor XYZ launching AI tool suite',
      description:
        'Major competitor XYZ is preparing to launch a comprehensive AI marketing tool suite next month, based on social media announcements and job postings.',
      source: 'Social Media Monitoring',
      signalType: 'COMPETITION_MOVE',
      confidence: 0.92,
      impact: 'CRITICAL',
      createdAt: '2023-06-03T09:15:00Z',
    },
    {
      id: '3',
      title: 'Shift toward video content on professional platforms',
      description:
        'Analysis shows a 43% increase in video content engagement on LinkedIn and other professional platforms compared to last quarter.',
      source: 'Platform Analytics',
      signalType: 'SENTIMENT_SHIFT',
      confidence: 0.78,
      impact: 'MEDIUM',
      createdAt: '2023-06-01T16:45:00Z',
    },
    {
      id: '4',
      title: 'New privacy regulations affecting digital marketing',
      description:
        'Upcoming changes to digital privacy regulations in EU markets will impact tracking and personalization capabilities starting next quarter.',
      source: 'Regulatory Monitoring',
      signalType: 'REGULATORY_CHANGE',
      confidence: 0.95,
      impact: 'HIGH',
      createdAt: '2023-05-28T11:20:00Z',
    },
    {
      id: '5',
      title: 'Micro-influencer marketing effectiveness increasing',
      description:
        'Data suggests micro-influencer campaigns (10k-50k followers) are showing 3.2x better ROI than celebrity endorsements in the current quarter.',
      source: 'Campaign Analysis',
      signalType: 'MARKET_OPPORTUNITY',
      confidence: 0.82,
      impact: 'MEDIUM',
      createdAt: '2023-05-25T14:10:00Z',
    },
  ];

  // Use mock data if no trends are available
  useEffect(() => {
    if (!loading && trends.length === 0) {
      setTrends(mockTrends);
    }
  }, [loading]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Market Trend Analysis</h1>
          <p className="text-muted-foreground mt-1">
            AI-detected market trends and signals to inform your marketing
            strategy
          </p>
        </div>

        <Button onClick={refreshTrends} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Detect New Trends
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trends.length}</div>
            <p className="text-xs text-muted-foreground">
              {
                trends.filter(
                  (t) =>
                    new Date(t.createdAt) >
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                ).length
              }{' '}
              new in the last 7 days
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              High Impact Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                trends.filter(
                  (t) => t.impact === 'HIGH' || t.impact === 'CRITICAL',
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                (trends.reduce((acc, trend) => acc + trend.confidence, 0) /
                  (trends.length || 1)) *
                100
              ).toFixed(1)}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Trend reliability score
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Top Trend Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {Object.entries(
                    trends.reduce(
                      (acc, trend) => {
                        acc[trend.signalType] =
                          (acc[trend.signalType] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    ),
                  ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Most common trend signal type
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trends..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="KEYWORD_TREND">Keyword Trends</SelectItem>
              <SelectItem value="TOPIC_EMERGENCE">Emerging Topics</SelectItem>
              <SelectItem value="SENTIMENT_SHIFT">Sentiment Shifts</SelectItem>
              <SelectItem value="COMPETITION_MOVE">Competitor Moves</SelectItem>
              <SelectItem value="INDUSTRY_NEWS">Industry News</SelectItem>
              <SelectItem value="REGULATORY_CHANGE">
                Regulatory Changes
              </SelectItem>
              <SelectItem value="VIRAL_CONTENT">Viral Content</SelectItem>
              <SelectItem value="MARKET_OPPORTUNITY">
                Market Opportunities
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={impactFilter} onValueChange={setImpactFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by impact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Impacts</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Trend Signals</CardTitle>
          <CardDescription>
            AI-detected trends and signals from across the digital landscape
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTrends.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trend</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Detected</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrends.map((trend) => (
                  <TableRow
                    key={trend.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedTrend(trend)}
                  >
                    <TableCell className="font-medium">{trend.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getSignalTypeLabel(trend.signalType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{trend.source}</TableCell>
                    <TableCell>
                      <Badge className={getImpactColor(trend.impact)}>
                        {trend.impact}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(trend.confidence * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(trend.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">No trends found</p>
              <p className="text-muted-foreground text-center max-w-md">
                No trends match your current filters. Try adjusting your search
                or filters, or run a new trend detection.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed trend view dialog */}
      {selectedTrend && (
        <Dialog
          open={!!selectedTrend}
          onOpenChange={(open: boolean) => !open && setSelectedTrend(null)}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedTrend.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-3 mt-2">
                <Badge className={getImpactColor(selectedTrend.impact)}>
                  {selectedTrend.impact} Impact
                </Badge>
                <Badge variant="outline">
                  {getSignalTypeLabel(selectedTrend.signalType)}
                </Badge>
                <span className="text-muted-foreground">
                  {format(parseISO(selectedTrend.createdAt), 'MMMM d, yyyy')}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-sm">{selectedTrend.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Source</h3>
                  <p className="text-sm">{selectedTrend.source}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Confidence</h3>
                  <p className="text-sm">
                    {(selectedTrend.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">
                  Recommended Actions
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  {selectedTrend.impact === 'CRITICAL' && (
                    <>
                      <li className="text-sm">
                        Schedule immediate strategy meeting
                      </li>
                      <li className="text-sm">
                        Prepare response plan within 24-48 hours
                      </li>
                      <li className="text-sm">Alert executive team</li>
                    </>
                  )}
                  {selectedTrend.impact === 'HIGH' && (
                    <>
                      <li className="text-sm">
                        Incorporate into next sprint planning
                      </li>
                      <li className="text-sm">
                        Create content addressing this trend
                      </li>
                      <li className="text-sm">Adjust campaign messaging</li>
                    </>
                  )}
                  {selectedTrend.impact === 'MEDIUM' && (
                    <>
                      <li className="text-sm">
                        Monitor development of this trend
                      </li>
                      <li className="text-sm">
                        Consider incorporating into upcoming content
                      </li>
                    </>
                  )}
                  {selectedTrend.impact === 'LOW' && (
                    <>
                      <li className="text-sm">
                        Keep track of this trend for future reference
                      </li>
                      <li className="text-sm">No immediate action required</li>
                    </>
                  )}
                </ul>
              </div>

              {selectedTrend.rawData && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Raw Data</h3>
                  <pre className="text-xs p-3 bg-muted rounded-md overflow-x-auto">
                    {JSON.stringify(selectedTrend.rawData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTrend(null)}>
                Close
              </Button>
              <Button>Generate Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
