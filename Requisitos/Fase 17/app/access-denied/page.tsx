import { ShieldAlert, Clock, Ban, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AccessDeniedPage({
    searchParams
}: {
    searchParams: Promise<{ reason?: string; date?: string }>
}) {
    const { reason, date } = await searchParams;

    const config = {
        invalid: {
            icon: <Key className="h-12 w-12 text-red-500" />,
            title: "Enlace no válido",
            description: "El enlace de acceso que has utilizado no es correcto o ha sido modificado."
        },
        expired: {
            icon: <Clock className="h-12 w-12 text-orange-500" />,
            title: "Acceso caducado",
            description: "Tu tiempo de estancia ha finalizado y el acceso a la guía se ha cerrado automáticamente."
        },
        inactive: {
            icon: <Ban className="h-12 w-12 text-red-500" />,
            title: "Acceso revocado",
            description: "Este acceso ha sido desactivado por el anfitrión."
        },
        too_early: {
            icon: <Clock className="h-12 w-12 text-blue-500" />,
            title: "Acceso no disponible aún",
            description: `Tu acceso comenzará el ${date ? new Date(date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' }) : 'la fecha prevista'}.`
        },
        token_required: {
            icon: <ShieldAlert className="h-12 w-12 text-slate-400" />,
            title: "Acceso restringido",
            description: "Para acceder a esta guía necesitas un enlace privado proporcionado por tu anfitrión."
        }
    }[reason as string] || {
        icon: <ShieldAlert className="h-12 w-12 text-red-500" />,
        title: "Acceso Denegado",
        description: "No tienes permiso para ver este contenido."
    };

    return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white text-center space-y-8">
                <div className="flex justify-center transition-transform hover:scale-110 duration-500">
                    <div className="p-6 bg-slate-50 rounded-[2rem] ring-1 ring-black/[0.03]">
                        {config.icon}
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        {config.title}
                    </h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        {config.description}
                    </p>
                </div>

                <div className="pt-4">
                    <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800 h-14 rounded-2xl font-black shadow-xl shadow-black/10 transition-all active:scale-95">
                        <Link href="/">
                            Volver al inicio
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div className="h-px w-12 bg-slate-200" />
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.4em]">
                        GuideFlow Security
                    </p>
                </div>
            </div>
        </div>
    );
}
