'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const INCIDENT_STATUS = ['open', 'investigating', 'monitoring', 'resolved'];
const INCIDENT_TYPES = ['incident', 'maintenance'];

export default function IncidentsPage() {
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateDialog, setUpdateDialog] = useState({ open: false, incidentId: null });
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'open',
    incidentType: 'incident',
    services: [],
    initialUpdate: '',
  });
  const [updateMessage, setUpdateMessage] = useState('');
  const [busyIncident, setBusyIncident] = useState(null);

  const loadData = async () => {
    setLoading(true);
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

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () =>
    setForm({
      title: '',
      description: '',
      status: 'open',
      incidentType: 'incident',
      services: [],
      initialUpdate: '',
    });

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!form.services.length) {
      toast.error('Select at least one service');
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        incidentType: form.incidentType,
        services: form.services,
        initialUpdate: form.initialUpdate?.trim() || undefined,
      };
      const { incident } = await apiClient.post('/incidents', payload);
      setIncidents((prev) => [incident, ...prev]);
      toast.success('Incident created');
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const openUpdateDialog = (incidentId) => {
    setUpdateDialog({ open: true, incidentId });
    setUpdateMessage('');
  };

  const submitIncidentUpdate = async () => {
    if (!updateMessage.trim()) {
      toast.error('Update message cannot be empty');
      return;
    }
    try {
      setBusyIncident(updateDialog.incidentId);
      const { incident } = await apiClient.put(
        `/incidents/${updateDialog.incidentId}/update`,
        { message: updateMessage.trim() },
      );
      setIncidents((prev) =>
        prev.map((item) => (item.id === incident.id ? incident : item)),
      );
      toast.success('Update added');
      setUpdateDialog({ open: false, incidentId: null });
      setUpdateMessage('');
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setBusyIncident(null);
    }
  };

  const resolveIncident = async (incidentId) => {
    try {
      setBusyIncident(incidentId);
      const { incident } = await apiClient.put(`/incidents/${incidentId}/resolve`);
      setIncidents((prev) =>
        prev.map((item) => (item.id === incident.id ? incident : item)),
      );
      toast.success('Incident resolved');
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setBusyIncident(null);
    }
  };

  const activeIncidents = useMemo(
    () => incidents.filter((incident) => incident.status !== 'resolved'),
    [incidents],
  );

  const resolvedIncidents = useMemo(
    () => incidents.filter((incident) => incident.status === 'resolved'),
    [incidents],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Incidents & maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Communicate outages and planned work. Tie updates to services so customers stay informed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log incident or maintenance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="incident-title">Title</Label>
                  <Input
                    id="incident-title"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident-description">Description</Label>
                  <Textarea
                    id="incident-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={4}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="incident-status">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger id="incident-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INCIDENT_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incident-type">Type</Label>
                    <Select
                      value={form.incidentType}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, incidentType: value }))
                      }
                    >
                      <SelectTrigger id="incident-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INCIDENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Impacted services</Label>
                  <div className="grid gap-2">
                    {services.map((service) => {
                      const checked = form.services.includes(service.id);
                      return (
                        <label
                          key={service.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm transition-colors ${
                            checked ? 'bg-accent' : 'hover:bg-muted/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={(event) => {
                              setForm((prev) => {
                                if (event.target.checked) {
                                  return { ...prev, services: [...prev.services, service.id] };
                                }
                                return {
                                  ...prev,
                                  services: prev.services.filter((id) => id !== service.id),
                                };
                              });
                            }}
                          />
                          <span>
                            <span className="font-medium">{service.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {service.description || 'No description'}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                    {services.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Create services first before logging incident impact.
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident-initial-update">First update (optional)</Label>
                  <Textarea
                    id="incident-initial-update"
                    value={form.initialUpdate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, initialUpdate: event.target.value }))
                    }
                    rows={3}
                    placeholder="Optional note that will appear in the timeline"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={services.length === 0}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Active incidents ({activeIncidents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading incidents...</p>
            ) : activeIncidents.length ? (
              activeIncidents.map((incident) => (
                <div key={incident.id} className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold">{incident.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(incident.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {incident.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {incident.services?.map((serviceId) => {
                      const service = services.find((item) => item.id === serviceId);
                      return (
                        <Badge key={serviceId} variant="secondary">
                          {service?.name ?? 'Service'}
                        </Badge>
                      );
                    })}
                  </div>
                  {incident.updates?.length ? (
                    <div className="space-y-2 rounded-md bg-muted/40 p-3 text-xs">
                      {incident.updates.slice().reverse().slice(0, 3).map((update, index) => (
                        <div key={`${incident.id}-update-${index}`} className="space-y-1">
                          <p className="font-medium capitalize">{update.status}</p>
                          <p className="text-muted-foreground">{update.message}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(update.timestamp || update.createdAt || Date.now()).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openUpdateDialog(incident.id)}
                      disabled={busyIncident === incident.id}
                    >
                      Add update
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => resolveIncident(incident.id)}
                      disabled={busyIncident === incident.id}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No active incidents. Keep monitoring your services.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Resolved ({resolvedIncidents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading incidents...</p>
            ) : resolvedIncidents.length ? (
              resolvedIncidents.map((incident) => (
                <div key={incident.id} className="space-y-2 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold">{incident.title}</p>
                    <Badge variant="outline" className="capitalize">
                      {incident.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Resolved at{' '}
                    {incident.resolvedAt
                      ? new Date(incident.resolvedAt).toLocaleString()
                      : 'unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No resolved incidents yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={updateDialog.open}
        onOpenChange={(open) => setUpdateDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add incident update</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            value={updateMessage}
            onChange={(event) => setUpdateMessage(event.target.value)}
            placeholder="Describe the latest incident state..."
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setUpdateDialog({ open: false, incidentId: null })}
            >
              Cancel
            </Button>
            <Button onClick={submitIncidentUpdate} disabled={busyIncident === updateDialog.incidentId}>
              Save update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
