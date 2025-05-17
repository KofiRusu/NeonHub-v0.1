'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { 
  BarChart,
  LineChart,
  CheckCircle,
  Trending,
  MessageSquare,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function MarketingDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Fetch campaigns and trends data
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // These would be replaced with actual API calls
        const campaignResponse = await fetch('/api/campaigns');
        const trendResponse = await fetch('/api/trends');
        
        if (campaignResponse.ok && trendResponse.ok) {
          const campaignData = await campaignResponse.json();
          const trendData = await trendResponse.json();
          
          setCampaigns(campaignData);
          setTrends(trendData);
        }
      } catch (error) {
        console.error('Error fetching marketing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketing Hub</h1>
        <Button>Create Campaign</Button>
      </div>
      
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.filter(c => c?.status === 'ACTIVE')?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +2.5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Content Created</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142</div>
                <p className="text-xs text-muted-foreground">
                  +14.2% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Outreach Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68%</div>
                <p className="text-xs text-muted-foreground">
                  +5.1% from last month
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Your last 5 marketing campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading campaigns...</p>
                ) : campaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-center">No campaigns yet. Create your first campaign to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campaigns.slice(0, 5).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-2 border-b">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">{campaign.type}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                          campaign.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 
                          campaign.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {campaign.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Latest Trend Signals</CardTitle>
                <CardDescription>Recent trends detected by AI</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading trends...</p>
                ) : trends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6">
                    <Trending className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-center">No trend signals detected yet. Configure your trend detection agent to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trends.slice(0, 5).map((trend) => (
                      <div key={trend.id} className="flex items-center p-2 border-b">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          trend.impact === 'HIGH' ? 'bg-red-500' : 
                          trend.impact === 'MEDIUM' ? 'bg-yellow-500' : 
                          'bg-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium">{trend.title}</p>
                          <p className="text-sm text-muted-foreground">{trend.source}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="campaigns" className="space-y-4">
          <h2 className="text-xl font-semibold">Campaign Management</h2>
          <p className="text-muted-foreground">Create and manage AI-powered marketing campaigns</p>
          
          {/* Campaign content would go here */}
          <div className="h-[400px] flex items-center justify-center border rounded-md">
            <p className="text-muted-foreground">Campaign management interface will be displayed here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <h2 className="text-xl font-semibold">Content Generation</h2>
          <p className="text-muted-foreground">Create and manage AI-generated marketing content</p>
          
          {/* Content generation interface would go here */}
          <div className="h-[400px] flex items-center justify-center border rounded-md">
            <p className="text-muted-foreground">Content generation interface will be displayed here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="outreach" className="space-y-4">
          <h2 className="text-xl font-semibold">Outreach Management</h2>
          <p className="text-muted-foreground">Manage AI-assisted outreach and follow-ups</p>
          
          {/* Outreach management interface would go here */}
          <div className="h-[400px] flex items-center justify-center border rounded-md">
            <p className="text-muted-foreground">Outreach management interface will be displayed here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <h2 className="text-xl font-semibold">Trend Analysis</h2>
          <p className="text-muted-foreground">View and analyze market trends detected by AI</p>
          
          {/* Trend analysis interface would go here */}
          <div className="h-[400px] flex items-center justify-center border rounded-md">
            <p className="text-muted-foreground">Trend analysis interface will be displayed here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 