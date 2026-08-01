import ActionCard from "../ui/ActionCard";
import list from "../../icons/to-do-list.png"
import combustible from "../../icons/cost.png"
import mantenimiento from "../../icons/support.png"
import accidente from "../../icons/warning-sign.png"
import registrarNovedad from "../../icons/steering-wheel.png"
import consultas from "../../icons/icono-consultas.png"
export default function QuickActions() {
    return (
        <section className="w-full space-y-2 mt-7">
            <h2 className="text-xs font-bold text-gray-800 mb-4">Acciones rápidas</h2>
            <div className="grid grid-cols-3 gap-3">
                <ActionCard
                    titulo="Novedades en mi jornada"
                    descripcion="Ver y registrar novedades"
                    img={list}
                />
                <ActionCard
                    titulo="Combustible"
                    descripcion="Registrar suministro"
                    img={combustible}
                />
                <ActionCard
                    titulo="Mantenimiento"
                    descripcion="Reportar mantenimiento"
                    img={mantenimiento}
                />
                <ActionCard
                    titulo="Accidente"
                    descripcion="Reportar accidente"
                    img={accidente}
                />
                <ActionCard
                    titulo="Registrar viaje"
                    descripcion="registrar contenido"
                    img={registrarNovedad}
                />
                <ActionCard
                    titulo="Consultas"
                    descripcion="Ver viajes del día"
                    img={consultas}
                />

            </div>
        </section>
    );
}