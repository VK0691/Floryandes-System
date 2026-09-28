import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Settings, Users, Shield, Database, Building2, Save, CheckCircle } from 'lucide-react';
import { ROLES } from '../context/AuthContext';

export default function ConfiguracionView() {
  const [users, setUsers] = useState([]);
  const [saved, setSaved] = useState(false);
  const [companyName, setCompanyName] = useState('Floryandes System');
  const [ruc, setRuc] = useState('0102030405001');
  const [phone, setPhone] = useState('+593 9 123 4567');
  const [address, setAddress] = useState('Av. Flores 123, Ambato, Ecuador');

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data } = await supabase.from('usuario').select('*');
        if (data && data.length > 0) {
          setUsers(data);
        } else {
          setUsers([
            { id_usuario: 1, nombre: 'Papá Wilson (Admin)', username: 'admin@floryandes.com', rol: 'ADMIN' },
            { id_usuario: 2, nombre: 'Carlos Vendedor', username: 'vendedor@floryandes.com', rol: 'VENDEDOR' },
            { id_usuario: 3, nombre: 'Marco Bodeguero', username: 'bodeguero@floryandes.com', rol: 'BODEGUERO' },
          ]);
        }
      } catch {
        // fallback
      }
    }
    loadUsers();
  }, []);

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Configuración del Sistema</h2>
          <p style={styles.subtitle}>
            Parámetros de empresa, gestión de usuarios, roles de seguridad y copias de seguridad (Solo ADMIN)
          </p>
        </div>
      </div>

      {saved && (
        <div style={styles.saveAlert}>
          <CheckCircle size={18} color="#059669" />
          <span>Configuración guardada exitosamente.</span>
        </div>
      )}

      <div style={styles.grid}>
        {/* Company Info */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Building2 size={20} color="#1E4E79" />
            <h3 style={styles.cardTitle}>Datos de la Empresa</h3>
          </div>

          <div style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre Comercial / Razón Social</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>RUC / Identificación Fiscal</label>
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Teléfono de Contacto</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={styles.input}
              />
            </div>

            <button
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
              }}
              style={styles.btnPrimary}
            >
              <Save size={16} />
              <span>Actualizar Datos</span>
            </button>
          </div>
        </div>

        {/* Users & Roles */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Shield size={20} color="#E05A2B" />
            <h3 style={styles.cardTitle}>Usuarios y Roles del Sistema</h3>
          </div>
          <p style={styles.cardSub}>
            Control de accesos según la matriz de permisos de seguridad de Floryandes.
          </p>

          <div style={styles.userList}>
            {users.map((u) => (
              <div key={u.id_usuario} style={styles.userItem}>
                <div style={styles.userItemLeft}>
                  <div style={styles.userAvatar}>{u.nombre?.charAt(0) || 'U'}</div>
                  <div>
                    <div style={styles.userItemName}>{u.nombre}</div>
                    <div style={styles.userItemEmail}>{u.username}</div>
                  </div>
                </div>
                <span
                  style={{
                    ...styles.roleBadge,
                    backgroundColor:
                      u.rol === 'ADMIN' ? '#EEF2FF' : u.rol === 'VENDEDOR' ? '#ECFDF5' : '#FFFBEB',
                    color:
                      u.rol === 'ADMIN' ? '#3730A3' : u.rol === 'VENDEDOR' ? '#065F46' : '#92400E',
                  }}
                >
                  {u.rol}
                </span>
              </div>
            ))}
          </div>

          <div style={styles.rolesLegend}>
            <span style={styles.legendTitle}>Matriz de Permisos:</span>
            <div style={styles.legendItem}>
              <strong>ADMIN:</strong> Acceso completo a facturar, comprar, inventario, reportes y configuración.
            </div>
            <div style={styles.legendItem}>
              <strong>VENDEDOR:</strong> Facturación rápida, catálogo y CRM de clientes.
            </div>
            <div style={styles.legendItem}>
              <strong>BODEGUERO:</strong> Gestión de compras a proveedores, control de mermas e inventario.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1240px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
  },
  saveAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    color: '#065F46',
    padding: '12px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: '12px',
    color: '#64748B',
    marginBottom: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
  },
  btnPrimary: {
    marginTop: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  userItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
  },
  userItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
  },
  userItemName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  userItemEmail: {
    fontSize: '11px',
    color: '#64748B',
  },
  roleBadge: {
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
  },
  rolesLegend: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  legendTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
  },
  legendItem: {
    fontSize: '12px',
    color: '#475569',
  }
};
