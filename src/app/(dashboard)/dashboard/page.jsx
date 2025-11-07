'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { apiClient } from '@/services/api-client';

const STATUS_ORDER = ['Operational', 'Degraded', 'Partial Outage', 'Major Outage'];

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ services: serviceList }, { incidents: incidentList }] = await Promise.all([
          apiClient.get('/services'),
          apiClient.get('/incidents'),
        ]);
        setServices(serviceList);
        setIncidents(incidentList);
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const overallStatus = services.reduce((highest, service) => {
    const statusIndex = STATUS_ORDER.indexOf(service.status);
    return statusIndex > highest ? statusIndex : highest;
  }, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Overall Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {services.length === 0
                ? 'No services yet'
                : STATUS_ORDER[overallStatus] ?? 'Operational'}
            </p>
            <p className="text-sm text-muted-foreground">
              {services.length} service{services.length === 1 ? '' : 's'} tracked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {incidents.filter((incident) => incident.status !== 'resolved').length}
            </p>
            <p className="text-sm text-muted-foreground">
              Active incidents and maintenances
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resolved Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {incidents.filter((incident) => incident.status === 'resolved').length}
            </p>
            <p className="text-sm text-muted-foreground">Resolved incidents in history</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest Update</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : incidents.length ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">{incidents[0].title}</p>
                <Badge variant="outline" className="capitalize">
                  {incidents[0].status}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No incident history yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Services</CardTitle>
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard/services">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading services...</p>
            ) : services.length ? (
              services.slice(0, 5).map((service) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </div>
                  <Badge className="capitalize">{service.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Add your first service to start tracking uptime.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Incidents timeline</CardTitle>
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard/incidents">Open log</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading incidents...</p>
            ) : incidents.length ? (
              incidents.slice(0, 5).map((incident) => (
                <div key={incident.id} className="space-y-1 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{incident.title}</p>
                    <Badge variant="outline" className="capitalize">
                      {incident.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(incident.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {incident.description}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No incidents recorded. Create one when you need to communicate downtime.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
