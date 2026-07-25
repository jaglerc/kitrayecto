
import type {
    LoginRequest,
    LoginResponse
} from "../auth/auth.types.js"

import bcrypt from "bcrypt"
import { AuthRepository } from "../auth/auth.repository.js";
import { SignJWT } from "jose"
export class AuthService {
    static async login(
        data: LoginRequest,
    ): Promise<LoginResponse> {
        const { cedula, password } = data;
        const user = await AuthRepository.findByCedula(cedula);

        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            throw new Error("Contraseña invalida");
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("No existe el JWT")
        }

        const secretKey = new TextEncoder().encode(jwtSecret);

        const token = await new SignJWT({
            role: user.role,
        })
            .setProtectedHeader({
                alg: "HS256",
            })

            .setSubject(user.id.toString())
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(secretKey)
        return {
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                role: user.role
            }
        }
    }
}