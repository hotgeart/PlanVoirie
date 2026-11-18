import { useEffect, useState } from 'react';
import { dist, fmt } from '../geometry/math';
import { useStore } from '../store/useStore';
import { exportPng } from '../export/exportPng';
import type { PdfOptions } from '../export/exportPdf';

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label={title}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

/** Saisie de la distance réelle entre les deux points cliqués sur l'image. */
export function CalibrateDialog() {
  const calibration = useStore((s) => s.calibration);
  const [value, setValue] = useState('');
  useEffect(() => setValue(''), [calibration]);
  if (!calibration) return null;
  const st = useStore.getState();
  const real = parseFloat(value.replace(',', '.'));
  const valid = real > 0;
  const close = () => st.set({ calibration: null, tool: 'select' });
  return (
    <Modal title="Calibrer l'échelle" onClose={close}>
      <p>
        Distance mesurée actuellement entre les deux points : <strong>{fmt(dist(calibration.a, calibration.b))} m</strong>.
        Saisissez la distance réelle : l'image sera redimensionnée pour être à l'échelle du plan.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) st.applyCalibration(real);
        }}
      >
        <label className="field">
          <span>Distance réelle</span>
          <div className="num">
            <input autoFocus inputMode="decimal" value={value} placeholder="ex. 25" onChange={(e) => setValue(e.target.value)} />
            <em>m</em>
          </div>
        </label>
        <div className="modal-actions">
          <button type="button" onClick={close}>Annuler</button>
          <button type="submit" className="primary" disabled={!valid}>Appliquer</button>
        </div>
      </form>
    </Modal>
  );
}

const SCALES = [50, 100, 200, 250, 500, 1000, 2000];

/** Options d'export PNG / PDF, avec cartouche éditable. */
export function ExportDialog() {
  const mode = useStore((s) => s.exportMode);
  const meta = useStore((s) => s.meta);
  const [transparent, setTransparent] = useState(false);
  const [grid, setGrid] = useState(false);
  const [area, setArea] = useState<'content' | 'view'>('content');
  const [format, setFormat] = useState<PdfOptions['format']>('a3');
  const [orientation, setOrientation] = useState<PdfOptions['orientation']>('landscape');
  const [scale, setScale] = useState<'auto' | number>('auto');
  const [date, setDate] = useState(() => new Date().toLocaleDateString('fr-FR'));
  const [busy, setBusy] = useState(false);
  if (!mode) return null;
  const st = useStore.getState();
  const close = () => st.set({ exportMode: null });

  const run = async () => {
    setBusy(true);
    try {
      if (mode === 'png') await exportPng({ transparent, grid, area });
      else await (await import('../export/exportPdf')).exportPdf({ format, orientation, scale, grid, area, title: meta.title, author: meta.author, date });
      close();
    } catch (e) {
      console.error(e);
      st.notify("L'export a échoué.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={mode === 'png' ? 'Exporter en PNG' : 'Exporter en PDF'} onClose={close}>
      <label className="field">
        <span>Zone exportée</span>
        <select value={area} onChange={(e) => setArea(e.target.value as 'content' | 'view')}>
          <option value="content">Tout le plan</option>
          <option value="view">Vue actuelle</option>
        </select>
      </label>
      {mode === 'png' ? (
        <>
          <label className="field">
            <span>Fond</span>
            <select value={transparent ? 't' : 'w'} onChange={(e) => setTransparent(e.target.value === 't')}>
              <option value="w">Blanc</option>
              <option value="t">Transparent</option>
            </select>
          </label>
          <p className="info">Résolution ×2, barre d'échelle incluse.</p>
        </>
      ) : (
        <>
          <div className="row2">
            <label className="field">
              <span>Format</span>
              <select value={format} onChange={(e) => setFormat(e.target.value as PdfOptions['format'])}>
                <option value="a4">A4</option>
                <option value="a3">A3</option>
              </select>
            </label>
            <label className="field">
              <span>Orientation</span>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value as PdfOptions['orientation'])}>
                <option value="landscape">Paysage</option>
                <option value="portrait">Portrait</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Échelle</span>
            <select value={String(scale)} onChange={(e) => setScale(e.target.value === 'auto' ? 'auto' : Number(e.target.value))}>
              <option value="auto">Automatique (ajustée au plan)</option>
              {SCALES.map((s) => <option key={s} value={s}>1:{s}</option>)}
            </select>
          </label>
          <h4>Cartouche</h4>
          <label className="field">
            <span>Titre</span>
            <input type="text" value={meta.title} onChange={(e) => st.setMeta({ title: e.target.value })} />
          </label>
          <div className="row2">
            <label className="field">
              <span>Auteur</span>
              <input type="text" value={meta.author} onChange={(e) => st.setMeta({ author: e.target.value })} />
            </label>
            <label className="field">
              <span>Date</span>
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>
        </>
      )}
      <label className="field check">
        <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} />
        <span>Inclure la grille</span>
      </label>
      <div className="modal-actions">
        <button onClick={close}>Annuler</button>
        <button className="primary" disabled={busy} onClick={() => void run()}>{busy ? 'Export…' : 'Exporter'}</button>
      </div>
    </Modal>
  );
}
