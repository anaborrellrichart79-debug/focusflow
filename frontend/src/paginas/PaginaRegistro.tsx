import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { registrarse } from '@/almacen/sesionSlice';
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
import { calcularEdad } from '@/utilidades/fechas';

export function PaginaRegistro() {
  const intl = useIntl();
  const navegar = useNavigate();
  const despachar = usarDespachador();
  const { cargando, error } = usarSelector((estado) => estado.sesion);

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [correoTutor, setCorreoTutor] = useState('');

  const esMenorDeEdad = fechaNacimiento !== '' && calcularEdad(fechaNacimiento) < 18;

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    const resultado = await despachar(
      registrarse({
        correo,
        contrasena,
        nombre: nombre || undefined,
        fechaNacimiento,
        correoTutor: esMenorDeEdad ? correoTutor : undefined,
      }),
    );
    if (registrarse.fulfilled.match(resultado)) {
      navegar('/');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'auth.registro.titulo' })}</CardTitle>
          <CardDescription>
            <Link to="/login" className="underline">
              {intl.formatMessage({ id: 'auth.registro.enlaceLogin' })}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={alEnviar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre">
                {intl.formatMessage({ id: 'auth.registro.nombre' })}
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="correo">
                {intl.formatMessage({ id: 'auth.registro.correo' })}
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
                {intl.formatMessage({ id: 'auth.registro.contrasena' })}
              </Label>
              <Input
                id="contrasena"
                type="password"
                required
                minLength={8}
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-nacimiento">
                {intl.formatMessage({ id: 'auth.registro.fechaNacimiento' })}
              </Label>
              <Input
                id="fecha-nacimiento"
                type="date"
                required
                value={fechaNacimiento}
                onChange={(evento) => setFechaNacimiento(evento.target.value)}
              />
            </div>
            {esMenorDeEdad && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="correo-tutor">
                  {intl.formatMessage({ id: 'auth.registro.correoTutor' })}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {intl.formatMessage({ id: 'auth.registro.correoTutorAyuda' })}
                </p>
                <Input
                  id="correo-tutor"
                  type="email"
                  required
                  value={correoTutor}
                  onChange={(evento) => setCorreoTutor(evento.target.value)}
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={cargando}>
              {intl.formatMessage({ id: 'auth.registro.boton' })}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
