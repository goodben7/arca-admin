import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center login-form-ambient">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-white shadow-float flex items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">ARCA SIRH</p>
                    </div>
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
