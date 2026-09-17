import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { iniciarSesionUsuario } from '@/almacen/sesionSlice';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PaginaLogin() {
  const intl = useIntl();
  const navegar = useNavigate();
  const despachar = usarDespachador();
  const { cargando, error } = usarSelector((estado) => estado.sesion);

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    const resultado = await despachar(iniciarSesionUsuario({ correo, contrasena }));
    if (iniciarSesionUsuario.fulfilled.match(resultado)) {
      navegar('/');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'auth.login.titulo' })}</CardTitle>
          <CardDescription>
            <Link to="/registro" className="underline">
              {intl.formatMessage({ id: 'auth.login.enlaceRegistro' })}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={alEnviar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="correo">
                {intl.formatMessage({ id: 'auth.login.correo' })}
              </Label>
              <Input
                id="correo"
                type="email"
                required
                value={correo}
                onChange={(evento) => setCorreo(evento.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contrasena">
                {intl.formatMessage({ id: 'auth.login.contrasena' })}
              </Label>
              <Input
                id="contrasena"
                type="password"
                required
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={cargando}>
              {intl.formatMessage({ id: 'auth.login.boton' })}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
