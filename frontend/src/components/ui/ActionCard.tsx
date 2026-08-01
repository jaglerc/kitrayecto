interface ActionCardProps {
    titulo: string;
    descripcion: string;
    img: string;
    onClick?: () => void; 
}

export default function ActionCard({ titulo, descripcion, img, onClick }: ActionCardProps) {
    return (
        <div onClick={onClick} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center cursor-pointer hover:border-amber-400 transition-all active:scale-95">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-2">
                <img src={img} alt={titulo} className="h-6 w-6 object-contain" />
            </div>
            <h3 className="text-xs font-semibold text-gray-900 leading-tight">{titulo}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{descripcion}</p>
        </div>
    );
}
