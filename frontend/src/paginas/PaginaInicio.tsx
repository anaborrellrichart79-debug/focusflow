import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cerrarSesion } from '@/almacen/sesionSlice';
import { Button } from '@/components/ui/button';
import { SelectorIdioma } from '@/componentes/SelectorIdioma';

export function PaginaInicio() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const { usuario } = usarSelector((estado) => estado.sesion);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex w-full items-center justify-end gap-3">
        <SelectorIdioma />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight">
        {intl.formatMessage({ id: 'app.titulo' })}
      </h1>
      <p className="text-muted-foreground">
        {intl.formatMessage({ id: 'app.eslogan' })}
      </p>

      {usuario ? (
        <div className="flex flex-col items-center gap-3">
          <p>
            {intl.formatMessage(
              { id: 'auth.bienvenidoUsuario' },
              { nombre: usuario.nombre ?? usuario.correo },
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/objetivos">
                {intl.formatMessage({ id: 'inicio.irAObjetivos' })}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/pomodoro">
                {intl.formatMessage({ id: 'inicio.irAPomodoro' })}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/kanban">{intl.formatMessage({ id: 'inicio.irAKanban' })}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/eisenhower">
                {intl.formatMessage({ id: 'inicio.irAEisenhower' })}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/estadisticas">
                {intl.formatMessage({ id: 'inicio.irAEstadisticas' })}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => despachar(cerrarSesion())}>
              {intl.formatMessage({ id: 'auth.cerrarSesion' })}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
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
