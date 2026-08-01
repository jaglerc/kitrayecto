import userIcon from "../../icons/user.png";
interface HeaderProps {
    nombre?: string;
    role?: string;
}

export default function Header({ nombre, role }: HeaderProps) {
    return (
        <header className="fixed inset-x-0 top-0 z-50 bg-white px-4 py-1.5">
            <div className="mx-auto flex h-19 w-full items-center justify-between ">
                <img
                    src="/ruta-aviario.png"
                    alt="Ruta Aviario"
                    className="h-35 w-auto object-contain"
                />

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-0.5 leading-none">
                        <p className="m-0 text-sm font-medium text-gray-700">
                            Hola, {nombre}
                        </p>

                        <span className="text-xs text-gray-500">{role}</span>

                    </div>
                    <img
                    src={userIcon}
                    alt="Perfil"
                    className="h-11 w-11 object-contain"
                    />
                </div>
            </div>
        </header>
    );
}
