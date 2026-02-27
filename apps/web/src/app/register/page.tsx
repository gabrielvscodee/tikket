'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError, api } from '@/lib/api';
import { setToken } from '@/lib/auth';
import Link from 'next/link';
import { Ticket } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('A confirmação da senha não corresponde');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.register(name, email, password, passwordConfirmation);
      
      // Auto-login after registration by setting token
      if (response.access_token) {
        setToken(response.access_token);
        // Force page reload to update auth context
        window.location.href = '/dashboard';
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Falha no cadastro');
      } else {
        setError('Ocorreu um erro. Por favor, tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20 gap-8 py-8 px-4">
      <Link href="/" className="flex items-center gap-3 shrink-0 group">
        <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-lg">
          <Ticket className="h-9 w-9 text-primary-foreground" />
        </div>
        <span className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Tikket
        </span>
      </Link>
      <Card className="w-full max-w-md border-2 shadow-2xl backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-semibold">Criar Conta</CardTitle>
          <CardDescription className="text-muted-foreground">
            Digite suas informações para criar uma nova conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu-email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirmation" className="text-foreground">Confirmar Senha</Label>
              <Input
                id="passwordConfirmation"
                type="password"
                placeholder="••••••••"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
                className="bg-background border-input"
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <Link href="/login" className="text-primary hover:underline font-medium transition-colors">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
