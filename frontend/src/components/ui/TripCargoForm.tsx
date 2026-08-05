interface TripCargoFormProps {
    eggs: string;
    balancedFeed: string;
    onEggsChange: (value: string) => void;
    onBalancedFeedChange: (value: string) => void;
}

export default function TripCargoForm({ eggs, balancedFeed, onEggsChange, onBalancedFeedChange }: TripCargoFormProps) {
    return (
        <fieldset>
            <legend className="text-xs font-semibold text-gray-900">3. Contenido transportado</legend>
            <p className="mt-1 text-[10px] text-gray-500">Registra únicamente los dos tipos de carga permitidos.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="rounded-xl border border-gray-200 p-3"><span className="text-[10px] font-semibold text-gray-700">Huevos (unidades)</span><div className="mt-2 flex items-center gap-2"><span className="text-xl text-amber-500">○</span><input type="number" min="0.01" step="1" inputMode="numeric" value={eggs} onChange={(event) => onEggsChange(event.target.value)} placeholder="360" className="min-w-0 w-full text-base font-semibold outline-none" /></div><span className="text-[9px] text-gray-400">Unidades</span></label>
                <label className="rounded-xl border border-gray-200 p-3"><span className="text-[10px] font-semibold text-gray-700">Alimento balanceado</span><div className="mt-2 flex items-center gap-2"><span className="text-xl text-amber-500">▱</span><input type="number" min="0.01" step="0.01" inputMode="decimal" value={balancedFeed} onChange={(event) => onBalancedFeedChange(event.target.value)} placeholder="520" className="min-w-0 w-full text-base font-semibold outline-none" /></div><span className="text-[9px] text-gray-400">Kilogramos</span></label>
            </div>
        </fieldset>
    );
}
