import { execSync } from 'node:child_process';

// Deja la base de datos de los tests vacía de usuarios (y, en cascada, de
// todo lo suyo). El catálogo de cursos y asignaturas se queda: lo carga el
// backend al arrancar. Si la base de datos no existe todavía, se crea (las
// migraciones las aplica el propio arranque del backend de pruebas).
function psql(baseDatos: string, sql: string) {
  return execSync(`docker exec focusflow-postgres psql -U focusflow -d ${baseDatos} -tAc "${sql}"`, {
    encoding: 'utf-8',
  }).trim();
}

export default function prepararBaseDeDatos() {
  const existe = psql('focusflow', "select 1 from pg_database where datname = 'focusflow_e2e'");
  if (existe !== '1') {
    execSync('docker exec focusflow-postgres createdb -U focusflow focusflow_e2e');
  }
  const hayTablas = psql('focusflow_e2e', "select count(*) from information_schema.tables where table_name = 'usuarios'");
  if (hayTablas === '1') psql('focusflow_e2e', 'truncate table usuarios cascade');
}
