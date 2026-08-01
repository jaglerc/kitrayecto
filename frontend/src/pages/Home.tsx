import Footer from "../components/ui/Footer";
import Header from "../components/ui/Header";
import WelcomeBanner from "../components/ui/WelcomeBanner"
import QuickActions from "../components/ui/QuickActions"

interface UsuarioGuardado {
    id: number;
    nombre: string;
    role: string;
}
export default function Home() {
    const usuarioGuardado = localStorage.getItem("user");

    const usuario: UsuarioGuardado | null = usuarioGuardado ?JSON.parse(usuarioGuardado) : null;

    if (!usuario) return null;

    return (
        <div>
            <Header nombre={usuario.nombre} role={usuario.role} />
            <main className="px-2 pb-24 pt-24">
                <div>
                    <WelcomeBanner nombre={usuario.nombre} />

                    <section className="flex ">
                        <QuickActions/>

                    </section>

                </div>

            </main>
            <Footer/>
        </div>
    )
}
