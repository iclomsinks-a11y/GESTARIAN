import { useState, useEffect } from 'react';
import { 
  getPerfil, 
  isSimulating, 
  getSimulatedRole, 
  isDeveloper, 
  subscribeAuth,
  loginAsDeveloper,
  loginAsUsuario,
  loginAsAutorizado,
  loginAsCliente,
  logout,
  startSimulation,
  stopSimulation,
  authorizeWorkshopRequest,
  rejectWorkshopRequest,
  updateWorkshopLicense,
  createWorkshopEmployee,
  updateWorkshopEmployee,
  deleteWorkshopEmployee,
  getStoredSolicitudes,
  getStoredEmpleados,
  registerWorkshopRequest,
  switchDevelopmentRole,
  PerfilUsuario,
  RoleType,
  TipoLicencia
} from '../services/authService';

export function useAuth() {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(() => getPerfil());
  const [simulating, setSimulating] = useState<boolean>(() => isSimulating());
  const [simulatedRole, setSimulatedRole] = useState<RoleType | null>(() => getSimulatedRole());

  useEffect(() => {
    const unsubscribe = subscribeAuth((newPerfil, isSim) => {
      setPerfil(newPerfil ? { ...newPerfil } : null);
      setSimulating(isSim);
      setSimulatedRole(getSimulatedRole());
    });
    return unsubscribe;
  }, []);

  const rolActual: RoleType = perfil?.rol || 'CLIENTE';
  const esDev = isDeveloper();

  return {
    perfil,
    rolActual,
    esDev,
    isSimulating: simulating,
    simulatedRole,
    switchDevelopmentRole,
    loginAsDeveloper,
    loginAsUsuario,
    loginAsAutorizado,
    loginAsCliente,
    logout,
    startSimulation,
    stopSimulation,
    authorizeWorkshopRequest,
    rejectWorkshopRequest,
    updateWorkshopLicense,
    createWorkshopEmployee,
    updateWorkshopEmployee,
    deleteWorkshopEmployee,
    getStoredSolicitudes,
    getStoredEmpleados,
    registerWorkshopRequest
  };
}
