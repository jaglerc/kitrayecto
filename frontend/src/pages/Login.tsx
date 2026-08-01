import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import Input from "../components/ui/input";
import { Button } from "../components/ui/Button";
import { authService } from "../services/auth.service";

export default function Login() {
    const navigate = useNavigate();
    const [cedula, setCedula] = useState("");
    const [password, setPassword] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mensajeError, setMensajeError] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");

    const iniciarSesion = (
        event: FormEvent<HTMLFormElement>
    ): void => {
        event.preventDefault();

        setMensajeError("");
        setMensajeExito("");

        if (!cedula.trim()) {
            setMensajeError("Ingresa tu cédula.");
            return;
        }

        if (!password) {
            setMensajeError("Ingresa tu contraseña.");
            return;
        }

        setCargando(true);

        authService
            .login({
                cedula: cedula.trim(),
                password,
            })
            .then((respuesta) => {
                console.log(
                    "Respuesta del backend:",
                    respuesta
                );

                localStorage.setItem(
                    "token",
                    respuesta.token
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(respuesta.user)
                );

                navigate("/home", {
                    replace: true,
                });
            })
            .catch((error: unknown) => {
                if (error instanceof Error) {
                    setMensajeError(error.message);
                    return;
                }

                setMensajeError(
                    "Ocurrió un error al iniciar sesión."
                );
            })
            .finally(() => {
                setCargando(false);
            });
    };

    return (
        <main
            className="flex min-h-dvh items-center justify-center bg-white px-4 py-6"
        >
            <form
                onSubmit={iniciarSesion}
                acceptCharset="UTF-8"
                className="w-full max-w-md bg-white p-8 sm:border sm:rounded-2xl sm:border-gray-200 sm:shadow-lg"
            >
                <img
                    src="/ruta-aviario.png"
                    alt="Ruta Aviario"
                    className="-translate-y-24 mx-auto -mb-30 h-auto w-80 object-contain"
                />

                <div className="mb-6 text-center">
                    <h1 className="text-[30px] font-bold text-gray-700">
                        ¡Bienvenido de nuevo!
                    </h1>

                    <p className="mt-1 text-sm text-gray-400">
                        Inicia sesión para continuar
                    </p>
                </div>

                <div className="mx-auto w-full max-w-sm space-y-4">
                    <Input
                        value={cedula}
                        onChange={(value: string) => {
                            setCedula(value);
                            setMensajeError("");
                            setMensajeExito("");
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="username"
                        placeholder="Cédula"
                        disabled={cargando}
                    />

                    <Input
                        value={password}
                        onChange={(value: string) => {
                            setPassword(value);
                            setMensajeError("");
                            setMensajeExito("");
                        }}
                        type="password"
                        autoComplete="current-password"
                        placeholder="Contraseña"
                        disabled={cargando}
                    />

                    {mensajeError && (
                        <p
                            role="alert"
                            className="text-sm text-red-500"
                        >
                            {mensajeError}
                        </p>
                    )}

                    {mensajeExito && (
                        <p
                            role="status"
                            className="text-sm text-green-600"
                        >
                            {mensajeExito}
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={cargando}
                        className="h-14 w-full bg-amber-400 text-gray-700 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cargando
                            ? "Iniciando sesión..."
                            : "Iniciar sesión"}
                    </Button>
                </div>
            </form>
        </main>
    );
}
