import { useState } from "react"
import userIcon from "../../icons/user.png"
import notificationIcon from "../../icons/notification.png"
import houseIcon from "../../icons/apartment.png"
import list from "../../icons/clipboard.png"
import car from "../../icons/lorry.png"

type OpcionNav = "inicio" | "jornada" | "novedades" | "notificaciones" | "perfil";

interface FooterNavProps {
    opcion?: OpcionNav;
    onOpcion?: (opcion: OpcionNav) => void;
}

export default function FooterNav({ opcion, onOpcion }: FooterNavProps) {
    const [opcionInterna, setOpcionInterna] = useState<OpcionNav>("inicio");
    const opcionActiva = opcion ?? opcionInterna;

    const clickOpcion = (nuevaOpcion: OpcionNav) => {
        setOpcionInterna(nuevaOpcion);
        onOpcion?.(nuevaOpcion);
    };

    const estiloIcono = (boton: OpcionNav) => ({
        filter: opcionActiva === boton
            ? "brightness(0) saturate(100%) invert(75%) sepia(95%) saturate(900%) hue-rotate(355deg) brightness(102%) contrast(104%)"
            : "none"
    });

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white px-2 py-2 shadow-sm">
            <nav className="mx-auto flex max-w-md items-end justify-between gap-13">
                <button onClick={() => clickOpcion("inicio")} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-all ${opcionActiva === "inicio" ? "scale-105 opacity-100" : "opacity-40 hover:opacity-75"}`}>
                    <img
                        src={houseIcon}
                        alt="Inicio"
                        className="h-8 w-8 object-contain transition-all sm:h-6 sm:w-6"
                        style={estiloIcono("inicio")}
                    />
                    <span className={`text-[9px] font-medium transition-colors sm:text-[10px] ${opcionActiva === "inicio" ? "text-amber-500" : "text-gray-700"}`}>Inicio</span>
                </button>

                <button onClick={() => clickOpcion("jornada")} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-all ${opcionActiva === "jornada" ? "scale-105 opacity-100" : "opacity-40 hover:opacity-75"}`}>
                    <img
                        src={list}
                        alt="Mi jornada"
                        className="h-8 w-8 object-contain transition-all sm:h-6 sm:w-6"
                        style={estiloIcono("jornada")}
                    />
                    <span className={`text-[9px] font-medium transition-colors sm:text-[10px] ${opcionActiva === "jornada" ? "text-amber-500" : "text-gray-700"}`}>Mi jornada</span>
                </button>

                <button onClick={() => clickOpcion("novedades")} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-all ${opcionActiva === "novedades" ? "scale-105 opacity-100" : "opacity-40 hover:opacity-75"}`}>
                    <img
                        src={car}
                        alt="Novedades"
                        className="h-12 w-12 object-contain transition-all sm:h-8 sm:w-8"
                        style={estiloIcono("novedades")}
                    />
                    <span className={`text-[11px] font-medium transition-colors sm:text-[10px] ${opcionActiva === "novedades" ? "text-amber-500" : "text-gray-700"}`}>Novedades</span>
                </button>

                <button onClick={() => clickOpcion("notificaciones")} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-all ${opcionActiva === "notificaciones" ? "scale-105 opacity-100" : "opacity-40 hover:opacity-75"}`}>
                    <img
                        src={notificationIcon}
                        alt="Notificaciones"
                        className="h-8 w-8 object-contain transition-all sm:h-6 sm:w-6"
                        style={estiloIcono("notificaciones")}
                    />
                    <span className={`text-[9px] font-medium transition-colors sm:text-[10px] ${opcionActiva === "notificaciones" ? "text-amber-500" : "text-gray-700"}`}>Notificaciones</span>
                </button>

                <button onClick={() => clickOpcion("perfil")} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-all ${opcionActiva === "perfil" ? "scale-105 opacity-100" : "opacity-40 hover:opacity-75"}`}>
                    <img
                        src={userIcon}
                        alt="Perfil"
                        className="h-8 w-8 object-contain transition-all sm:h-6 sm:w-6"
                        style={estiloIcono("perfil")}
                    />
                    <span className={`text-[9px] font-medium transition-colors sm:text-[10px] ${opcionActiva === "perfil" ? "text-amber-500" : "text-gray-700"}`}>Perfil</span>
                </button>
            </nav>
        </footer>
    )
}
