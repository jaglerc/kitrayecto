import camionetaIcon from "../../icons/camioneta.png";
import carroIcon from "../../icons/carro.png";
import motocargueroIcon from "../../icons/motocarguero.png";
import motocicletaIcon from "../../icons/motocicleta.png";
import userIcon from "../../icons/user.png";
import type { VehicleType } from "./VehicleTypeStep";

interface TripHeaderSummaryProps { type: VehicleType; plate: string; driverName: string; }
const vehicles = { camioneta: { label: "Camioneta", icon: camionetaIcon }, carro: { label: "Carro", icon: carroIcon }, motocarguero: { label: "Motocarguero", icon: motocargueroIcon }, motocicleta: { label: "Motocicleta", icon: motocicletaIcon } };

export default function TripHeaderSummary({ type, plate, driverName }: TripHeaderSummaryProps) {
    const vehicle = vehicles[type];
    return <section className="grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"><div className="flex flex-col items-center px-2 text-center"><img src={vehicle.icon} alt="" className="h-11 w-16 object-contain" /><p className="text-[9px] text-gray-500">Vehículo</p><p className="text-xs font-semibold">{vehicle.label}</p></div><div className="flex flex-col items-center justify-center px-2 text-center"><span className="rounded border-2 border-gray-500 bg-white px-2 py-1 text-xs font-bold shadow-sm">{plate}</span><p className="mt-2 text-[9px] text-gray-500">Placa</p><p className="text-xs font-semibold">{plate}</p></div><div className="flex flex-col items-center px-2 text-center"><img src={userIcon} alt="" className="h-11 w-11 object-contain" /><p className="text-[9px] text-gray-500">Conductor</p><p className="line-clamp-2 text-xs font-semibold">{driverName}</p></div></section>;
}
