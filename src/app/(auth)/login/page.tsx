import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>}>
            <LoginForm />
        </Suspense>
    );
}
