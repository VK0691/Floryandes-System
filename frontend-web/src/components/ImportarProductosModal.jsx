import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import { importarProductosLote } from '../services/productosService';

export default function ImportarProductosModal({ isOpen, onClose, onImportCompleted }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setErrors([]);
    setResultSummary(null);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    parseCSV(selected);
  };

  const parseCSV = (fileObj) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

      if (lines.length < 2) {
        setErrors(['El archivo no contiene suficientes filas de datos.']);
        return;
      }

      // Separador por coma o punto y coma
      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';

      const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/["']/g, ''));

      const requiredCols = ['codigo', 'nombre', 'precio_base'];
      const missing = requiredCols.filter(c => !headers.includes(c));

      if (missing.length > 0) {
        setErrors([`Faltan columnas requeridas en el archivo: ${missing.join(', ')}`]);
        return;
      }

      const rows = [];
      const validationIssues = [];

      for (let i = 1; i < lines.length; i++) {
        const rawCols = lines[i].split(delimiter).map(c => c.trim().replace(/["']/g, ''));
        if (rawCols.length < headers.length) continue;

        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = rawCols[idx];
        });

        // Validaciones
        const price = parseFloat(rowObj.precio_base);
        const isValid = rowObj.codigo && rowObj.nombre && !isNaN(price) && price > 0;

        if (!isValid) {
          validationIssues.push(`Fila ${i + 1}: código o nombre ausente, o precio base inválido.`);
        }

        rows.push({
          codigo: rowObj.codigo || '',
          nombre: rowObj.nombre || '',
          categoria: rowObj.categoria || 'Bonches',
          unidad_medida: rowObj.unidad_medida || 'BONCHE',
          precio_base: rowObj.precio_base || '0',
          stock_actual: rowObj.stock_actual || '0',
          stock_minimo: rowObj.stock_minimo || '10',
          isValid,
        });
      }

      setParsedRows(rows);
      setErrors(validationIssues);
    };

    reader.readAsText(fileObj);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "codigo,nombre,categoria,unidad_medida,precio_base,stock_actual,stock_minimo\n" +
      "BON-AMA,Bonche Rosas Amarillas,Bonches,BONCHE,2.75,50,15\n" +
      "BON-ROS,Bonche Rosas Rosadas,Bonches,BONCHE,2.50,60,20\n" +
      "GYP,Gipsofilia,Hierbas,UNIDAD,1.80,30,10";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_productos_floryandes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const res = await importarProductosLote(validRows);
      if (res.success) {
        setResultSummary(res);
        if (onImportCompleted) onImportCompleted();
      } else {
        setErrors([res.error || 'Error al procesar la importación.']);
      }
    } catch (err) {
      setErrors([err.message || 'Error inesperado.']);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerTitleGroup}>
            <FileSpreadsheet size={20} color="#1E4E79" />
            <div>
              <h3 style={styles.title}>Importar Catálogo de Productos</h3>
              <p style={styles.subtitle}>Carga masiva desde archivo CSV o Excel</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div style={styles.body}>
          {resultSummary ? (
            <div style={styles.resultBox}>
              <CheckCircle2 size={36} color="#059669" />
              <h4 style={styles.resultTitle}>Importación Completada</h4>
              <p style={styles.resultSub}>
                Se procesaron exitosamente <strong>{resultSummary.importados}</strong> productos en el catálogo de Supabase.
              </p>
              {resultSummary.errores?.length > 0 && (
                <div style={styles.errorsSummary}>
                  <span style={styles.errorsTitle}>Incidencias reportadas:</span>
                  <ul>
                    {resultSummary.errores.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  resetState();
                  onClose();
                }}
                style={styles.doneBtn}
              >
                Cerrar y Ver Productos
              </button>
            </div>
          ) : (
            <>
              {/* Template Download Prompt */}
              <div style={styles.templatePrompt}>
                <div>
                  <span style={styles.templateTitle}>Formato requerido</span>
                  <p style={styles.templateSub}>
                    El archivo debe incluir las cabeceras: <code>codigo, nombre, categoria, unidad_medida, precio_base, stock_actual, stock_minimo</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={styles.templateBtn}
                >
                  <Download size={14} />
                  <span>Descargar Plantilla CSV</span>
                </button>
              </div>

              {/* Upload Zone */}
              <div style={styles.uploadZone}>
                <Upload size={32} color="#94A3B8" />
                <span style={styles.uploadTitle}>
                  {file ? file.name : 'Selecciona o arrastra tu archivo CSV'}
                </span>
                <span style={styles.uploadSub}>Archivos compatibles: .csv con codificación UTF-8</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                />
              </div>

              {/* Validation Warnings */}
              {errors.length > 0 && (
                <div style={styles.errorBox}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <span style={styles.errorHead}>Se detectaron incidencias en el archivo:</span>
                    <ul style={styles.errorList}>
                      {errors.slice(0, 4).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {errors.length > 4 && <li>...y {errors.length - 4} advertencias más.</li>}
                    </ul>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div style={styles.previewSection}>
                  <div style={styles.previewHeader}>
                    <span style={styles.previewTitle}>
                      Previsualización ({parsedRows.filter(r => r.isValid).length} válidos de {parsedRows.length} filas)
                    </span>
                  </div>

                  <div style={styles.tableCard}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.trHead}>
                          <th style={styles.th}>CÓDIGO</th>
                          <th style={styles.th}>NOMBRE</th>
                          <th style={styles.th}>CATEGORÍA</th>
                          <th style={{ ...styles.th, textAlign: 'right' }}>PRECIO</th>
                          <th style={{ ...styles.th, textAlign: 'right' }}>STOCK</th>
                          <th style={{ ...styles.th, textAlign: 'center' }}>ESTADO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 6).map((r, i) => (
                          <tr key={i} style={styles.tr}>
                            <td style={styles.tdCode} className="num-mono">{r.codigo}</td>
                            <td style={styles.tdName}>{r.nombre}</td>
                            <td style={styles.td}>{r.categoria}</td>
                            <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">${r.precio_base}</td>
                            <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">{r.stock_actual}</td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                              <span
                                style={{
                                  ...styles.statusPill,
                                  backgroundColor: r.isValid ? '#ECFDF5' : '#FEF2F2',
                                  color: r.isValid ? '#059669' : '#DC2626',
                                }}
                              >
                                {r.isValid ? 'Correcto' : 'Error'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={importing}
                  style={styles.cancelBtn}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={importing || parsedRows.filter(r => r.isValid).length === 0}
                  onClick={handleExecuteImport}
                  style={{
                    ...styles.importBtn,
                    opacity: importing || parsedRows.filter(r => r.isValid).length === 0 ? 0.6 : 1,
                  }}
                >
                  <Upload size={16} />
                  <span>
                    {importing
                      ? 'Importando productos...'
                      : `Importar ${parsedRows.filter(r => r.isValid).length} Productos`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '680px',
    overflow: 'hidden',
    animation: 'fadeIn 0.2s ease-out',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '75vh',
    overflowY: 'auto',
  },
  templatePrompt: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  templateTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1E293B',
  },
  templateSub: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
  },
  templateBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1E4E79',
    cursor: 'pointer',
  },
  uploadZone: {
    position: 'relative',
    border: '2px dashed #CBD5E1',
    borderRadius: '12px',
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#FAFAFA',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  uploadTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1E293B',
    marginTop: '4px',
  },
  uploadSub: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  fileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#991B1B',
    fontSize: '12px',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  errorHead: {
    fontWeight: '700',
    display: 'block',
    marginBottom: '4px',
  },
  errorList: {
    paddingLeft: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  previewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
  },
  tableCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  trHead: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '8px 12px',
    fontSize: '12px',
    color: '#334155',
  },
  tdCode: {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#1E4E79',
  },
  tdName: {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#0F172A',
  },
  statusPill: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '12px',
    borderTop: '1px solid #F1F5F9',
  },
  cancelBtn: {
    padding: '9px 16px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  importBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 18px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(224, 90, 43, 0.25)',
  },
  resultBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '30px 10px',
    gap: '10px',
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0F172A',
  },
  resultSub: {
    fontSize: '13px',
    color: '#64748B',
  },
  errorsSummary: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '12px',
    color: '#991B1B',
    fontSize: '12px',
    textAlign: 'left',
    width: '100%',
    marginTop: '10px',
  },
  errorsTitle: {
    fontWeight: '700',
    display: 'block',
    marginBottom: '6px',
  },
  doneBtn: {
    marginTop: '12px',
    padding: '10px 20px',
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};
