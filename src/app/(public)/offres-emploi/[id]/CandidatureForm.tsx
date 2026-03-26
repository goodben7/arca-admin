'use client';

import { useState, useRef } from 'react';
import {
    User, Mail, Phone, FileText, Upload, X,
    CheckCircle2, AlertCircle, Loader2, Send, ChevronDown
} from 'lucide-react';
import { createApplicationPublic, uploadDocumentPublic } from '@/lib/api/application';

type Props = { jobOfferId: string; jobOfferTitle: string };

type FieldError = Partial<Record<string, string>>;

function validate(form: Record<string, string>, cvFile: File | null): FieldError {
    const errors: FieldError = {};
    if (!form.firstName.trim()) errors.firstName = 'Requis';
    if (!form.lastName.trim()) errors.lastName = 'Requis';
    if (!form.gender) errors.gender = 'Requis';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email invalide';
    if (!form.phone.trim()) errors.phone = 'Requis';
    if (!cvFile) errors.cv = 'Le CV est obligatoire';
    return errors;
}

export default function CandidatureForm({ jobOfferId, jobOfferTitle }: Props) {
    const [form, setForm] = useState({ firstName: '', lastName: '', gender: '', email: '', phone: '', notes: '' });
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [motivationFile, setMotivationFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<FieldError>({});
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const cvRef = useRef<HTMLInputElement>(null);
    const motivRef = useRef<HTMLInputElement>(null);

    function set(field: string, value: string) {
        setForm(p => ({ ...p, [field]: value }));
        setErrors(p => ({ ...p, [field]: undefined }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs = validate(form, cvFile);
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setStatus('loading');
        setErrorMsg('');

        try {
            // 1. Créer la candidature
            const application = await createApplicationPublic({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                gender: form.gender as 'M' | 'F',
                email: form.email.trim(),
                phone: form.phone.trim(),
                jobOffer: jobOfferId,
                notes: form.notes.trim() || undefined,
            });

            const appId = application.id;

            // 2. Upload CV
            const cvFormData = new FormData();
            cvFormData.append('file', cvFile!);
            cvFormData.append('type', 'CV');
            cvFormData.append('holderType', 'APPLICATION');
            cvFormData.append('holderId', appId);
            cvFormData.append('title', `CV — ${form.firstName} ${form.lastName}`);
            await uploadDocumentPublic(cvFormData);

            // 3. Upload lettre de motivation (si fournie)
            if (motivationFile) {
                const motivFormData = new FormData();
                motivFormData.append('file', motivationFile);
                motivFormData.append('type', 'OTHER');
                motivFormData.append('holderType', 'APPLICATION');
                motivFormData.append('holderId', appId);
                motivFormData.append('title', `Lettre de motivation — ${form.firstName} ${form.lastName}`);
                await uploadDocumentPublic(motivFormData);
            }

            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err?.message || 'Une erreur est survenue. Veuillez réessayer.');
        }
    }

    if (status === 'success') {
        return (
            <div className="bg-white rounded-3xl border border-secondary-100 shadow-sm overflow-hidden">
                <div className="px-8 py-12 flex flex-col items-center text-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-black text-secondary-900 uppercase tracking-tighter text-lg">
                            Candidature envoyée !
                        </p>
                        <p className="text-secondary-500 font-medium text-sm mt-2 max-w-sm">
                            Votre candidature pour le poste <span className="font-bold text-secondary-700">{jobOfferTitle}</span> a bien été reçue.
                            Notre équipe RH vous contactera dans les meilleurs délais.
                        </p>
                    </div>
                    <button
                        onClick={() => { setStatus('idle'); setForm({ firstName: '', lastName: '', gender: '', email: '', phone: '', notes: '' }); setCvFile(null); setMotivationFile(null); }}
                        className="text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        Soumettre une autre candidature
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-secondary-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-secondary-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-red-50 border border-accent-red-100 flex items-center justify-center">
                    <Send className="w-4 h-4 text-accent-red-500" />
                </div>
                <div>
                    <h2 className="font-black text-secondary-900 uppercase tracking-tighter text-base">
                        Postuler à cette offre
                    </h2>
                    <p className="text-secondary-400 font-medium text-xs italic">
                        Remplissez le formulaire ci-dessous
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
                {/* Erreur globale */}
                {status === 'error' && (
                    <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-rose-700">{errorMsg}</p>
                    </div>
                )}

                {/* Nom / Prénom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Prénom" error={errors.firstName} required>
                        <InputWithIcon
                            icon={User}
                            type="text"
                            placeholder="Jean"
                            value={form.firstName}
                            onChange={e => set('firstName', e.target.value)}
                            error={!!errors.firstName}
                        />
                    </Field>
                    <Field label="Nom" error={errors.lastName} required>
                        <InputWithIcon
                            icon={User}
                            type="text"
                            placeholder="Dupont"
                            value={form.lastName}
                            onChange={e => set('lastName', e.target.value)}
                            error={!!errors.lastName}
                        />
                    </Field>
                </div>

                {/* Genre + Téléphone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Genre" error={errors.gender} required>
                        <div className="relative">
                            <select
                                value={form.gender}
                                onChange={e => set('gender', e.target.value)}
                                className={`w-full appearance-none pl-4 pr-10 py-3 bg-secondary-50 border rounded-2xl text-sm font-medium text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all ${errors.gender ? 'border-rose-300 bg-rose-50' : 'border-secondary-200'}`}
                            >
                                <option value="">Sélectionner...</option>
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                        </div>
                    </Field>
                    <Field label="Téléphone" error={errors.phone} required>
                        <InputWithIcon
                            icon={Phone}
                            type="tel"
                            placeholder="+243 8X XXX XXXX"
                            value={form.phone}
                            onChange={e => set('phone', e.target.value)}
                            error={!!errors.phone}
                        />
                    </Field>
                </div>

                {/* Email */}
                <Field label="Adresse email" error={errors.email} required>
                    <InputWithIcon
                        icon={Mail}
                        type="email"
                        placeholder="jean.dupont@email.com"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                        error={!!errors.email}
                    />
                </Field>

                {/* Documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileDropZone
                        label="CV"
                        required
                        file={cvFile}
                        error={errors.cv}
                        accept=".pdf,.doc,.docx"
                        hint="PDF, DOC — max 5 Mo"
                        onSelect={f => { setCvFile(f); setErrors(p => ({ ...p, cv: undefined })); }}
                        onRemove={() => setCvFile(null)}
                        inputRef={cvRef}
                    />
                    <FileDropZone
                        label="Lettre de motivation"
                        file={motivationFile}
                        accept=".pdf,.doc,.docx"
                        hint="Optionnelle — PDF, DOC"
                        onSelect={setMotivationFile}
                        onRemove={() => setMotivationFile(null)}
                        inputRef={motivRef}
                    />
                </div>

                {/* Notes */}
                <Field label="Message (optionnel)">
                    <textarea
                        value={form.notes}
                        onChange={e => set('notes', e.target.value)}
                        placeholder="Ajoutez un message ou des précisions sur votre candidature..."
                        rows={3}
                        className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-2xl text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
                    />
                </Field>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center gap-3 bg-accent-red-500 hover:bg-accent-red-600 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-lg shadow-accent-red-200 transition-all"
                >
                    {status === 'loading' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                    ) : (
                        <><Send className="w-4 h-4" /> Envoyer ma candidature</>
                    )}
                </button>
            </form>
        </div>
    );
}

// ── Sous-composants ────────────────────────────────────────────────────────────

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary-500 flex items-center gap-1">
                {label}
                {required && <span className="text-accent-red-500">*</span>}
            </label>
            {children}
            {error && <p className="text-[11px] font-bold text-rose-500">{error}</p>}
        </div>
    );
}

function InputWithIcon({ icon: Icon, error, ...props }: { icon: React.ElementType; error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="relative">
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
                {...props}
                className={`w-full pl-10 pr-4 py-3 bg-secondary-50 border rounded-2xl text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all ${error ? 'border-rose-300 bg-rose-50' : 'border-secondary-200'}`}
            />
        </div>
    );
}

function FileDropZone({ label, required, file, error, accept, hint, onSelect, onRemove, inputRef }: {
    label: string; required?: boolean; file: File | null; error?: string;
    accept: string; hint: string;
    onSelect: (f: File) => void; onRemove: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary-500 flex items-center gap-1">
                {label}
                {required && <span className="text-accent-red-500">*</span>}
            </label>
            <input ref={inputRef} type="file" accept={accept} className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onSelect(f); }} />

            {file ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 border border-primary-100 rounded-2xl">
                    <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                    <span className="text-xs font-bold text-primary-700 truncate flex-1">{file.name}</span>
                    <button type="button" onClick={onRemove} className="shrink-0 w-5 h-5 flex items-center justify-center text-secondary-400 hover:text-rose-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className={`w-full flex flex-col items-center gap-2 px-4 py-5 border-2 border-dashed rounded-2xl transition-all hover:border-primary-300 hover:bg-primary-50/50 ${error ? 'border-rose-300 bg-rose-50/50' : 'border-secondary-200 bg-secondary-50/50'}`}
                >
                    <Upload className={`w-5 h-5 ${error ? 'text-rose-400' : 'text-secondary-400'}`} />
                    <span className="text-xs font-bold text-secondary-500">Cliquer pour sélectionner</span>
                    <span className="text-[10px] text-secondary-400">{hint}</span>
                </button>
            )}
            {error && <p className="text-[11px] font-bold text-rose-500">{error}</p>}
        </div>
    );
}
