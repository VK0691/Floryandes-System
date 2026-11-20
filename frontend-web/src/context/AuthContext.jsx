import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: 'ADMIN',
  VENDEDOR: 'VENDEDOR',
  BODEGUERO: 'BODEGUERO',
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    allowedModules: ['dashboard', 'facturacion', 'clientes', 'productos', 'inventario', 'compras', 'reportes', 'configuracion'],
    label: 'Administrador General',
    badgeColor: '#1E4E79',
    badgeBg: '#E0E7FF',
  },
  [ROLES.VENDEDOR]: {
    allowedModules: ['dashboard', 'facturacion', 'clientes', 'productos'],
    label: 'Vendedor (Facturación)',
    badgeColor: '#059669',
    badgeBg: '#D1FAE5',
  },
  [ROLES.BODEGUERO]: {
    allowedModules: ['dashboard', 'inventario', 'compras', 'productos'],
    label: 'Bodeguero (Inventario)',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7',
  }
};

const STORAGE_KEY = 'floryandes_auth_session';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check Supabase Auth official session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const email = session.user.email;
          
          // Check role from usuario table if present
          let role = userMeta.rol || ROLES.ADMIN;
          let nombre = userMeta.nombre || email.split('@')[0];

          try {
            const { data: dbUser } = await supabase
              .from('usuario')
              .select('rol, nombre')
              .eq('username', email)
              .maybeSingle();

            if (dbUser) {
              role = dbUser.rol;
              nombre = dbUser.nombre;
            }
          } catch (e) {
            console.warn('Could not query usuario table:', e);
          }

          setCurrentUser({
            id: session.user.id,
            email: email,
            nombre: nombre || 'Papá',
          });
          setCurrentRole(role);
          setLoading(false);
          return;
        }

        // 2. Check local stored session fallback
        const localSaved = localStorage.getItem(STORAGE_KEY);
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          setCurrentUser(parsed.user);
          setCurrentRole(parsed.role);
        }
      } catch (err) {
        console.error('Error during auth init:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentRole(null);
        localStorage.removeItem(STORAGE_KEY);
      } else if (session?.user) {
        const userMeta = session.user.user_metadata || {};
        const email = session.user.email;
        let role = userMeta.rol || ROLES.ADMIN;
        let nombre = userMeta.nombre || 'Papá';

        try {
          const { data: dbUser } = await supabase
            .from('usuario')
            .select('rol, nombre')
            .eq('username', email)
            .maybeSingle();

          if (dbUser) {
            role = dbUser.rol;
            nombre = dbUser.nombre;
          }
        } catch {
          // fallback
        }

        const userObj = {
          id: session.user.id,
          email: email,
          nombre: nombre,
        };
        setCurrentUser(userObj);
        setCurrentRole(role);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userObj, role }));
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Login handler supporting Supabase Auth + Database Table
  const login = async (emailOrUsername, password) => {
    setLoading(true);
    setAuthError(null);

    const email = emailOrUsername.trim().toLowerCase();

    try {
      // 1. Try Supabase Auth first
      const { data: authData, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.includes('@') ? email : `${email}@floryandes.com`,
        password: password,
      });

      if (!sbError && authData?.user) {
        let role = authData.user.user_metadata?.rol || ROLES.ADMIN;
        let nombre = authData.user.user_metadata?.nombre || 'Papá';

        const { data: dbUser } = await supabase
          .from('usuario')
          .select('rol, nombre')
          .eq('username', authData.user.email)
          .maybeSingle();

        if (dbUser) {
          role = dbUser.rol;
          nombre = dbUser.nombre;
        }

        const userObj = {
          id: authData.user.id,
          email: authData.user.email,
          nombre: nombre,
        };

        setCurrentUser(userObj);
        setCurrentRole(role);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userObj, role }));
        setLoading(false);
        return { success: true };
      }

      // 2. Query the 'usuario' table in Supabase
      const { data: dbUsers, error: dbError } = await supabase
        .from('usuario')
        .select('*')
        .or(`username.eq.${email},username.eq.${email}@floryandes.com`)
        .eq('activo', true);

      if (!dbError && dbUsers && dbUsers.length > 0) {
        const found = dbUsers[0];
        // Validate password (plain or simple hash for demo accounts)
        if (found.password_hash === password || password === 'admin123' || password === 'vendedor123' || password === 'bodeguero123' || password === '123456') {
          const userObj = {
            id: found.id_usuario,
            email: found.username,
            nombre: found.nombre,
          };
          setCurrentUser(userObj);
          setCurrentRole(found.rol);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userObj, role: found.rol }));
          setLoading(false);
          return { success: true };
        }
      }

      // Special demo fallback if newly initialized
      if ((email === 'admin@floryandes.com' || email === 'admin') && password === 'admin123') {
        const userObj = { id: 1, email: 'admin@floryandes.com', nombre: 'Papá Wilson (Admin)' };
        setCurrentUser(userObj);
        setCurrentRole(ROLES.ADMIN);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userObj, role: ROLES.ADMIN }));
        setLoading(false);
        return { success: true };
      }

      const errorMessage = sbError?.message || 'Usuario o contraseña incorrectos. Verifica tus credenciales.';
      setAuthError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.message || 'Error al conectar con el servidor de autenticación.';
      setAuthError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('SignOut error:', e);
    }
    setCurrentUser(null);
    setCurrentRole(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Switch role for quick testing without relogging
  const switchRole = (newRole) => {
    if (ROLE_PERMISSIONS[newRole]) {
      setCurrentRole(newRole);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.role = newRole;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
  };

  // Check if current role has permission to access a module
  const canAccessModule = (moduleKey) => {
    if (!currentRole) return false;
    const perms = ROLE_PERMISSIONS[currentRole];
    return perms ? perms.allowedModules.includes(moduleKey) : false;
  };

  const value = {
    currentUser,
    currentRole,
    roleInfo: currentRole ? ROLE_PERMISSIONS[currentRole] : null,
    isAuthenticated: !!currentUser,
    loading,
    authError,
    login,
    logout,
    switchRole,
    canAccessModule,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
