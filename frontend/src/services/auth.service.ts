export type UserRole = 'Administrador' | 'Supervisor' | 'Conductor'

export interface LoginCredentials {
  cedula: string
  password: string
}

export interface AuthenticatedUser {
  id: number
  nombre: string
  role: UserRole
}

export interface LoginResponse {
  token: string
  user: AuthenticatedUser
}

interface ApiErrorResponse {
  message?: string
  error?: string
}

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `La solicitud falló con el estado ${response.status}`

  try {
    const body = (await response.json()) as ApiErrorResponse
    message = body.message ?? body.error ?? message
  } catch {
    // La respuesta no contiene un cuerpo JSON.
  }

  return new ApiError(message, response.status)
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw await parseError(response)
    }

    return (await response.json()) as LoginResponse
  },
}
