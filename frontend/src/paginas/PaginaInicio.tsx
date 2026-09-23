import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarTareas } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { InicioPersonalizado } from '@/componentes/InicioPersonalizado';
import { SelectorIdioma } from '@/componentes/SelectorIdioma';
import { SelectorTema } from '@/componentes/SelectorTema';
import { cn } from '@/lib/utils';

export function PaginaInicio() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const { usuario } = usarSelector((estado) => estado.sesion);

  useEffect(() => {
    if (usuario) despachar(cargarTareas());
  }, [usuario, despachar]);

  return (
    <main
      className={cn(
        'relative mx-auto flex min-h-screen flex-col items-center gap-12 overflow-hidden px-4 text-center',
        // Con sesión, panel de tarjetas; sin sesión, portada centrada.
        usuario ? 'max-w-4xl gap-8 py-10' : 'max-w-2xl justify-center py-16 sm:py-24',
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_70%)]"
      />
      {!usuario && (
        <div className="absolute top-6 right-4 flex items-center gap-3 sm:top-8 sm:right-8">
          <SelectorTema />
          <SelectorIdioma />
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <h1 className="bg-gradient-to-br from-primary to-motivador bg-clip-text text-5xl font-semibold tracking-tight text-transparent lg:text-6xl">
          {intl.formatMessage({ id: 'app.titulo' })}
        </h1>
        <p className="text-lg text-muted-foreground">
          {intl.formatMessage({ id: 'app.eslogan' })}
        </p>
      </div>

      {usuario ? (
        <div className="flex w-full flex-col items-center gap-6">
          <p className="text-lg">
            {intl.formatMessage(
              { id: 'auth.bienvenidoUsuario' },
              { nombre: usuario.nombre ?? usuario.correo },
            )}
          </p>

          <InicioPersonalizado usuario={usuario} />
        </div>
      ) : (
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/login">{intl.formatMessage({ id: 'auth.login.titulo' })}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/registro">
              {intl.formatMessage({ id: 'auth.registro.titulo' })}
            </Link>
          </Button>
        </div>
      )}
    </main>
  );
}
