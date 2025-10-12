import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const BackendTest: React.FC = () => {
  const [tests, setTests] = useState<Record<string, { status: 'pending' | 'success' | 'error'; message: string }>>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults: Record<string, { status: 'pending' | 'success' | 'error'; message: string }> = {};

    // Test 1: API Base URL
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 
        (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://data-science-tracker.onrender.com/api');
      const response = await fetch(`${apiBaseUrl}/videos`);
      if (response.ok) {
        testResults['apiConnection'] = { status: 'success', message: 'Backend API is reachable' };
      } else {
        testResults['apiConnection'] = { status: 'error', message: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      testResults['apiConnection'] = { status: 'error', message: `Connection failed: ${error}` };
    }

    // Test 2: Videos Endpoint
    try {
      const videos = await apiService.getVideos();
      testResults['videosEndpoint'] = { 
        status: 'success', 
        message: `Successfully fetched ${videos.length} videos` 
      };
    } catch (error: any) {
      testResults['videosEndpoint'] = { 
        status: 'error', 
        message: `Failed to fetch videos: ${error.message}` 
      };
    }

    // Test 3: Folders Endpoint
    try {
      const folders = await apiService.getFolders();
      testResults['foldersEndpoint'] = { 
        status: 'success', 
        message: `Successfully fetched ${folders.length} folders` 
      };
    } catch (error: any) {
      testResults['foldersEndpoint'] = { 
        status: 'error', 
        message: `Failed to fetch folders: ${error.message}` 
      };
    }

    // Test 4: Auth Endpoint (without token)
    try {
      await apiService.getCurrentUser();
      testResults['authEndpoint'] = { 
        status: 'error', 
        message: 'Auth endpoint should require token' 
      };
    } catch (error: any) {
      if (error.message.includes('401') || error.message.includes('Invalid token')) {
        testResults['authEndpoint'] = { 
          status: 'success', 
          message: 'Auth endpoint correctly requires authentication' 
        };
      } else {
        testResults['authEndpoint'] = { 
          status: 'error', 
          message: `Unexpected auth error: ${error.message}` 
        };
      }
    }

    setTests(testResults);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Backend Connection Test
          <Button onClick={runTests} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(tests).map(([testName, result]) => (
          <div key={testName} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(result.status)}
              <div>
                <p className="font-medium capitalize">{testName.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-sm text-muted-foreground">{result.message}</p>
              </div>
            </div>
            {getStatusBadge(result.status)}
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">API Base URL:</p>
          <p className="text-xs text-muted-foreground font-mono">
            {import.meta.env.VITE_API_URL || 
              (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://data-science-tracker.onrender.com/api')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
