interface LoginCredentials {
    cedula: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user: {
        id: number;
        nombre: string;
    };
}

const API_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const authService = {
    async login(
        credentials: LoginCredentials
    ): Promise<LoginResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            let message = "No fue posible iniciar sesión";

            try {
                const body = await response.json() as { message?: string };
                message = body.message ?? message;
            } catch {
                // La respuesta no contenía JSON.
            }

            throw new Error(message);
        }

        return response.json();
    },
};
