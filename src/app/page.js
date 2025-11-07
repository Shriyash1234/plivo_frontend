'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchPublicOrganizations, fetchStatusSnapshot } from '@/services/public';

const STATUS_COLORS = {
  Operational: 'bg-emerald-500',
  Degraded: 'bg-amber-500',
  'Partial Outage': 'bg-orange-500',
  'Major Outage': 'bg-red-500',
};

const DEFAULT_ORG = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION ?? '';

export default function PublicStatusPage() {
  const [query, setQuery] = useState(DEFAULT_ORG);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [orgLoading, setOrgLoading] = useState(false);

  const loadStatus = async (identifier = query) => {
    if (!identifier) {
      toast.error('Select an organization to view status');
      return;
    }
    setLoading(true);
    try {
      const data = await fetchStatusSnapshot(identifier);
      setStatusData(data);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
      setStatusData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadOrganizations = async () => {
      setOrgLoading(true);
      try {
        const list = await fetchPublicOrganizations();
        setOrganizations(list);
        if (list.length && !DEFAULT_ORG) {
          setQuery(list[0].id);
          loadStatus(list[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      } finally {
        setOrgLoading(false);
      }
    };

    loadOrganizations();

    if (DEFAULT_ORG) {
      loadStatus(DEFAULT_ORG);
    }

    // TODO: integrate socket.io-client subscription to /status:update events once available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overallStatus = statusData?.overallStatus ?? 'Unknown';

  const statusDotClass = STATUS_COLORS[overallStatus] ?? 'bg-gray-400';

  const timeline = useMemo(() => statusData?.timeline ?? [], [statusData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-background">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Status page</span>
              <span>•</span>
              <span>
                {statusData?.organization?.name ?? 'Enter organization to view status'}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {statusData?.organization?.name ?? 'System availability'}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Track live health across all services. Bookmark this page or subscribe to updates to stay informed about maintenance, incidents, and performance changes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={query}
              onValueChange={(value) => {
                setQuery(value);
                if (value) {
                  loadStatus(value);
                }
              }}
            >
              <SelectTrigger className="sm:max-w-sm" disabled={orgLoading || loading}>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button type="button" disabled={loading || !query} onClick={() => loadStatus(query)}>
                {loading ? 'Fetching status...' : 'Load'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading || !statusData?.organization?.id}
                onClick={() => statusData?.organization?.id && loadStatus(statusData.organization.id)}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
            <span className={`h-3 w-3 rounded-full ${statusDotClass}`} />
            <div>
              <p className="font-medium">
                {statusData
                  ? `All systems ${overallStatus === 'Operational' ? 'operational' : 'reported as ' + overallStatus}`
                  : 'Awaiting status selection'}
              </p>
              {statusData?.generatedAt ? (
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(statusData.generatedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading services...</p>
              ) : statusData?.services?.length ? (
                statusData.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col gap-1 rounded-md border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    </div>
                    <Badge className="w-fit capitalize">{service.status}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No services found. Ask the administrator to configure the dashboard.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active incidents & maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading incidents...</p>
              ) : statusData?.activeIncidents?.length ? (
                statusData.activeIncidents.map((incident) => (
                  <div key={incident.id} className="space-y-2 rounded-md border border-border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{incident.title}</p>
                      <Badge variant="outline" className="capitalize">
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {incident.startedAt ? new Date(incident.startedAt).toLocaleString() : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">{incident.description}</p>
                    <div className="space-y-2 rounded bg-muted/40 p-3">
                      {incident.updates?.length ? (
                        incident.updates
                          .slice()
                          .reverse()
                          .slice(0, 3)
                          .map((update, index) => (
                            <div key={`${incident.id}-update-${index}`} className="space-y-1">
                              <p className="text-xs font-medium capitalize">{update.status}</p>
                              <p className="text-xs text-muted-foreground">{update.message}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {update.timestamp
                                  ? new Date(update.timestamp).toLocaleString()
                                  : ''}
                              </p>
                            </div>
                          ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No updates yet.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  All clear. No active incidents or maintenances.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading timeline...</p>
              ) : timeline.length ? (
                timeline.map((item, index) => (
                  <div key={`${item.type}-${index}`} className="space-y-1 border-l border-border pl-4">
                    <p className="text-xs text-muted-foreground">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                    </p>
                    <p className="text-sm font-medium capitalize">
                      {item.type === 'incident_update'
                        ? `Incident: ${item.incidentTitle}`
                        : `Service: ${item.serviceName}`}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{item.status}</p>
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Timeline is empty.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resolved incidents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading history...</p>
              ) : statusData?.pastIncidents?.length ? (
                statusData.pastIncidents.slice(0, 5).map((incident) => (
                  <div key={incident.id} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium">{incident.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Resolved {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : ''}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No incidents have been resolved yet.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </main>

      <footer className="border-t border-border bg-card/80 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Powered by Status Page demo</p>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" asChild>
              <Link href="/login">Administrator login</Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/register">Create workspace</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
