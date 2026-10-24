import React, { useEffect, useState, useCallback, useRef } from 'react';
import './Monitoreo.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const POLL_MS = 2000;

interface EstacionMon {
  id: number;
  nombre: string;
  orden: number;
  esperando: number;
  capacidad: number;
  ocupacion_pct: number;
  alerta: boolean;
}

interface BusMon {
  id: number;
  placa: string;
  capacidad: number;
  pasajeros: number;
  ocupacion_pct: number;
  estado: 'EN_RUTA' | 'EN_ESTACION' | 'ESPERANDO';
  origen: number;
  destino: number;
  progreso: number;
  espera_restante: number;
}

interface LineaMon {
  id: number;
  nombre: string;
  es_circuito: boolean;
  buses_requeridos_min: number;
  buses_requeridos_max: number;
  buses_asignados: number;
  cumple_flota: boolean;
  estaciones: EstacionMon[];
  buses: BusMon[];
}

interface EventoMon {
  id: number;
  minuto: number;
  tipo: 'ALERTA' | 'RESUELTA' | 'ESPERA' | 'INFO';
  mensaje: string;
}

interface Snapshot {
  minuto: number;
  pausado: boolean;
  capacidad_estacion: number;
  kpis: {
    lineas_activas: number;
    buses_en_operacion: number;
    buses_total: number;
    buses_sin_linea: number;
    buses_esperando: number;
    pasajeros_a_bordo: number;
    ocupacion_flota_pct: number;
    pasajeros_esperando: number;
    alertas_activas: number;
    lineas_fuera_de_norma: number;
  };
  lineas: LineaMon[];
  eventos: EventoMon[];
}

const nivelEstacion = (pct: number) => {
  if (pct >= 150) return 'critico';
  if (pct >= 100) return 'alto';
  if (pct >= 70) return 'medio';
  return 'normal';
};

const formatoReloj = (minuto: number) => {
  const total = 6 * 60 + minuto; // el servicio arranca a las 06:00 simuladas
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};



export const Monitoreo: React.FC = () => {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtroLinea, setFiltroLinea] = useState<number | 'todas'>('todas');
  const busy = useRef(false);

  const cargar = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await fetch(`${API_URL}/monitoreo`);
      if (!res.ok) throw new Error('No se pudo obtener el estado del monitoreo');
      setData(await res.json());
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error de conexión');
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, POLL_MS);
    return () => clearInterval(id);
  }, [cargar]);

  const togglePausa = async () => {
    if (!data) return;
    await fetch(`${API_URL}/monitoreo/pausa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pausado: !data.pausado }),
    });
    cargar();
  };

  const simularAglomeracion = async (estacion: EstacionMon) => {
    if (!window.confirm(`¿Simular una aglomeración en "${estacion.nombre}" para probar la alerta?`)) return;
    await fetch(`${API_URL}/monitoreo/estaciones/${estacion.id}/aglomeracion`, { method: 'POST' });
    cargar();
  };

  if (!data) {
    return (
      <section className="mon-section">
        <div className="mon-loading">{error ? `Error: ${error}` : 'Conectando con el centro de monitoreo…'}</div>
      </section>
    );
  }

  const { kpis } = data;
  const lineasVisibles = data.lineas.filter((l) => filtroLinea === 'todas' || l.id === filtroLinea);
  const alertas = data.lineas.flatMap((l) =>
    l.estaciones.filter((e) => e.alerta).map((e) => ({ ...e, linea: l.nombre })),
  );
  const fueraNorma = data.lineas.filter((l) => !l.cumple_flota);

  const imprimirBitacora = () => {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const filas = data.eventos
      .map(
        (ev) =>
          `<tr><td>${formatoReloj(ev.minuto)}</td><td>${esc(ev.tipo)}</td><td>${esc(ev.mensaje)}</td></tr>`,
      )
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bitácora de eventos</title>
<style>
  body { font-family: Arial, sans-serif; color: #222; margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #007030; }
  p { margin: 0 0 16px; font-size: 12px; color: #666; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #007030; color: #fff; text-align: left; padding: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  td { padding: 6px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  td:first-child { white-space: nowrap; width: 60px; }
  td:nth-child(2) { white-space: nowrap; width: 90px; }
</style></head><body>
<h1>Bitácora de eventos</h1>
<p>Impreso el ${new Date().toLocaleString('es-GT')} · Hora simulada ${formatoReloj(data.minuto)}</p>
<table><thead><tr><th>Hora</th><th>Tipo</th><th>Mensaje</th></tr></thead><tbody>${filas}</tbody></table>
</body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  return (
    <section className="mon-section">
      {/* Barra de estado */}
      <div className="mon-topbar">
        <div className="mon-live">
          <span className={`mon-dot ${data.pausado ? 'paused' : error ? 'error' : ''}`} />
          <span>{data.pausado ? 'PAUSADO' : error ? 'SIN CONEXIÓN' : 'EN VIVO'}</span>
          <span className="mon-clock">{formatoReloj(data.minuto)}</span>
          <span className="mon-sim-tag">Simulación · 1 tick = 1 min</span>
        </div>
        <div className="mon-controls">
          <select
            className="mon-select"
            value={filtroLinea}
            onChange={(e) => setFiltroLinea(e.target.value === 'todas' ? 'todas' : +e.target.value)}
          >
            <option value="todas">Todas las líneas</option>
            {data.lineas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>
          <button className="mon-btn" onClick={togglePausa}>
            {data.pausado ? 'Reanudar' : 'Pausar'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mon-kpis">
        <div className="mon-kpi">
          <span className="mon-kpi-label">Líneas activas</span>
          <span className="mon-kpi-value">{kpis.lineas_activas}</span>
        </div>
        <div className="mon-kpi">
          <span className="mon-kpi-label">Buses en operación</span>
          <span className="mon-kpi-value">
            {kpis.buses_en_operacion}
            <small> / {kpis.buses_total}</small>
          </span>
          <span className="mon-kpi-foot">{kpis.buses_sin_linea} sin línea asignada</span>
        </div>
        <div className="mon-kpi">
          <span className="mon-kpi-label">Pasajeros a bordo</span>
          <span className="mon-kpi-value">{kpis.pasajeros_a_bordo}</span>
          <div className="mon-meter">
            <div style={{ width: `${Math.min(100, kpis.ocupacion_flota_pct)}%` }} />
          </div>
          <span className="mon-kpi-foot">{kpis.ocupacion_flota_pct}% de la capacidad de la flota</span>
        </div>
        <div className="mon-kpi">
          <span className="mon-kpi-label">Esperando en estaciones</span>
          <span className="mon-kpi-value">{kpis.pasajeros_esperando}</span>
        </div>
        <div className={`mon-kpi ${kpis.alertas_activas ? 'danger' : 'ok'}`}>
          <span className="mon-kpi-label">Alertas de sobrecupo</span>
          <span className="mon-kpi-value">{kpis.alertas_activas}</span>
          <span className="mon-kpi-foot">Estación ≥ 150% de capacidad</span>
        </div>
        <div className={`mon-kpi ${kpis.buses_esperando ? 'warn' : ''}`}>
          <span className="mon-kpi-label">Buses en espera extra</span>
          <span className="mon-kpi-value">{kpis.buses_esperando}</span>
          <span className="mon-kpi-foot">Ocupación &lt; 25% · +5 min</span>
        </div>
      </div>

      <div className="mon-layout">
        {/* Mapas de líneas */}
        <div className="mon-lines">
          {lineasVisibles.length === 0 && (
            <div className="mon-empty">
              No hay líneas con al menos 2 estaciones y buses asignados para monitorear.
            </div>
          )}
          {lineasVisibles.map((linea) => (
            <LineaCard key={linea.id} linea={linea} onEstacion={simularAglomeracion} />
          ))}
        </div>

        {/* Panel lateral */}
        <aside className="mon-side">
          <div className="mon-panel">
            <h3>
              Alertas activas <span className="mon-count">{alertas.length}</span>
            </h3>
            {alertas.length === 0 ? (
              <p className="mon-muted">Sin alertas. Todas las estaciones operan con normalidad.</p>
            ) : (
              <ul className="mon-alert-list">
                {alertas.map((a) => (
                  <li key={a.id}>
                    <strong>{a.nombre}</strong>
                    <span>
                      {a.linea} · {a.esperando}/{a.capacidad} ({a.ocupacion_pct}%)
                    </span>
                    <em>Despachar bus de refuerzo</em>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {fueraNorma.length > 0 && (
            <div className="mon-panel warn">
              <h3>Flota fuera de norma</h3>
              <ul className="mon-alert-list">
                {fueraNorma.map((l) => (
                  <li key={l.id}>
                    <strong>{l.nombre}</strong>
                    <span>
                      {l.buses_asignados} buses · requeridos {l.buses_requeridos_min}–{l.buses_requeridos_max}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mon-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <h3>Bitácora de eventos</h3>
              <button
                type="button"
                className="mon-btn"
                onClick={imprimirBitacora}
                disabled={data.eventos.length === 0}
              >
                Imprimir bitácora
              </button>
            </div>
            {data.eventos.length === 0 ? (
              <p className="mon-muted">Esperando eventos…</p>
            ) : (
              <ul className="mon-events">
                {data.eventos.map((ev) => (
                  <li key={ev.id} className={`ev-${ev.tipo.toLowerCase()}`}>
                    <span className="ev-time">{formatoReloj(ev.minuto)}</span>
                    <span className="ev-msg">{ev.mensaje}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

const LineaCard: React.FC<{ linea: LineaMon; onEstacion: (e: EstacionMon) => void }> = ({ linea, onEstacion }) => {
  const n = linea.estaciones.length;
  const posX = (i: number) => (n === 1 ? 0 : (i / (n - 1)) * 100);

  const posicionBus = (b: BusMon) => {
    const a = posX(b.origen);
    const d = posX(b.destino);
    return a + (d - a) * b.progreso;
  };

  // Retorno: en no circulares cuando va hacia atrás; en circuitos al cerrar el bucle (última -> primera)
  const vaDeVuelta = (b: BusMon) => b.destino < b.origen;

  return (
    <article className="mon-line-card">
      <header className="mon-line-head">
        <div>
          <h3>{linea.nombre}</h3>
          <span className="mon-muted">
            {linea.es_circuito ? 'Circuito' : 'Ida y vuelta'} · {n} estaciones
          </span>
        </div>
        <span className={`mon-fleet ${linea.cumple_flota ? '' : 'bad'}`}>
          {linea.buses_asignados} buses (req. {linea.buses_requeridos_min}–{linea.buses_requeridos_max})
        </span>
      </header>

      <div className="mon-track-wrap">
        <div className={`mon-track ${linea.es_circuito ? 'circuit' : ''}`}>
          <div className="mon-rail" />
          <div className="mon-rail-return" />

          {linea.buses.map((b) => (
            <div
              key={b.id}
              className={`mon-bus ${b.estado.toLowerCase()} ${vaDeVuelta(b) ? 'back' : ''} ${
                b.ocupacion_pct < 25 ? 'low' : b.ocupacion_pct >= 90 ? 'full' : ''
              }`}
              style={{ left: `${posicionBus(b)}%` }}
              title={`${b.placa} · ${b.pasajeros}/${b.capacidad} pasajeros (${b.ocupacion_pct}%)`}
            >
              <div className="mon-bus-pin">
                <span className="mon-bus-plate">{b.placa}</span>
                <span className="mon-bus-load">
                  {b.pasajeros}/{b.capacidad}
                </span>
                <div className="mon-bus-bar">
                  <div style={{ width: `${b.ocupacion_pct}%` }} />
                </div>
                {b.estado === 'ESPERANDO' && <span className="mon-bus-wait">{b.espera_restante} min</span>}
              </div>
            </div>
          ))}

          {linea.estaciones.map((e, i) => (
            <button
              key={e.id}
              className={`mon-station ${nivelEstacion(e.ocupacion_pct)}`}
              style={{ left: `${posX(i)}%` }}
              onClick={() => onEstacion(e)}
              title="Clic para simular una aglomeración"
            >
              <span className="mon-node">{e.orden}</span>
              <span className="mon-station-name">{e.nombre}</span>
              <span className="mon-station-load">
                {e.esperando}/{e.capacidad}
              </span>
            </button>
          ))}
        </div>
      </div>
    </article>
  );
};
