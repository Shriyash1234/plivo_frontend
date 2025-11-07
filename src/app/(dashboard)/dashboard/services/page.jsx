'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const STATUS_OPTIONS = [
  'Operational',
  'Degraded',
  'Partial Outage',
  'Major Outage',
];

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'Operational' });
  const [busyService, setBusyService] = useState(null);

  const resetForm = () => setForm({ name: '', description: '', status: 'Operational' });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/services');
      setServices(response.services);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
      };
      if (!payload.name) {
        toast.error('Service name is required');
        return;
      }
      const { service } = await apiClient.post('/services', payload);
      setServices((prev) => [...prev, service]);
      toast.success('Service created');
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (serviceId, status) => {
    try {
      setBusyService(serviceId);
      const { service } = await apiClient.put(`/services/${serviceId}/status`, {
        status,
        message: `Status updated to ${status}`,
      });
      setServices((prev) =>
        prev.map((item) => (item.id === serviceId ? { ...item, ...service } : item)),
      );
      toast.success('Status updated');
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setBusyService(null);
    }
  };

  const handleDelete = async (serviceId) => {
    try {
      setBusyService(serviceId);
      await apiClient.delete(`/services/${serviceId}`);
      setServices((prev) => prev.filter((item) => item.id !== serviceId));
      toast.success('Service deleted');
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setBusyService(null);
    }
  };

  const sortedServices = useMemo(
    () =>
      [...services].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.name.localeCompare(b.name);
      }),
    [services],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Services</h1>
          <p className="text-sm text-muted-foreground">
            Keep your product catalog up to date so customers know what to expect.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchServices}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create service</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service-name">Name</Label>
                  <Input
                    id="service-name"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="API, Website, Database..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-description">Description</Label>
                  <Textarea
                    id="service-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Short summary for the status page"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="service-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Loading services...
                </TableCell>
              </TableRow>
            ) : sortedServices.length ? (
              sortedServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {service.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={service.status}
                      onValueChange={(value) => handleStatusChange(service.id, value)}
                      disabled={busyService === service.id}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(service.id)}
                      disabled={busyService === service.id}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  No services yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
