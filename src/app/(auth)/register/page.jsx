'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/providers/auth-provider';

const REGISTRATION_MODES = [
  { value: 'create', label: 'Create new organization' },
  { value: 'join', label: 'Join with invite token' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, token } = useAuth();

  const [mode, setMode] = useState('create');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    organizationId: '',
    inviteToken: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && token) {
      router.replace('/dashboard');
    }
  }, [loading, token, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    if (!payload.name) {
      toast.error('Name is required');
      return;
    }

    if (mode === 'create') {
      payload.organizationName = form.organizationName.trim();
      if (!payload.organizationName) {
        toast.error('Organization name is required');
        return;
      }
    } else {
      payload.organizationId = form.organizationId.trim();
      payload.inviteToken = form.inviteToken.trim();
      if (!payload.organizationId || !payload.inviteToken) {
        toast.error('Organization ID and invite token are required');
        return;
      }
    }

    try {
      setSubmitting(true);
      await register(payload);
      router.replace('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Create your workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Spin up a new status page or join an existing organization using an invite token.
        </p>

        <div className="mt-6 space-y-2">
          <Label>Registration mode</Label>
          <Select value={mode} onValueChange={(value) => setMode(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGISTRATION_MODES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              minLength={8}
              required
            />
          </div>

          {mode === 'create' ? (
            <div className="space-y-2">
              <Label htmlFor="organization-name">Organization name</Label>
              <Input
                id="organization-name"
                value={form.organizationName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, organizationName: event.target.value }))
                }
                placeholder="Acme Inc."
                required
              />
              <p className="text-xs text-muted-foreground">
                A new organization is provisioned and you will be set as the admin.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organization-id">Organization ID</Label>
                <Input
                  id="organization-id"
                  value={form.organizationId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, organizationId: event.target.value }))
                  }
                  placeholder="Mongo ObjectId"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-token">Invite token</Label>
                <Input
                  id="invite-token"
                  value={form.inviteToken}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, inviteToken: event.target.value }))
                  }
                  placeholder="Paste invite token"
                  required
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Continue'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
