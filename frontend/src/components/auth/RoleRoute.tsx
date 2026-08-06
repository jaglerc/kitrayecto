import type { ReactNode } from "react";
import { Navigate } from "react-router";
type UserRole="Administrador"|"Supervisor"|"Conductor";
interface RoleRouteProps { allowedRoles: UserRole[]; children: ReactNode; }
export default function RoleRoute({allowedRoles,children}:RoleRouteProps){const token=localStorage.getItem("token");let role:UserRole|undefined;try{role=(JSON.parse(localStorage.getItem("user")??"null")as{role?:UserRole}|null)?.role;}catch{role=undefined;}if(!token||!role)return <Navigate to="/login" replace/>;if(!allowedRoles.includes(role))return <Navigate to={role==="Conductor"?"/home":"/supervisor"} replace/>;return children;}
