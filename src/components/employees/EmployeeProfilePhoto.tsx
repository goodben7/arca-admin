'use client';

import { Loader2, Upload } from 'lucide-react';

interface EmployeeProfilePhotoProps {
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    isUploading?: boolean;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EmployeeProfilePhoto({
    firstName,
    lastName,
    photoUrl,
    isUploading = false,
    onUpload,
}: EmployeeProfilePhotoProps) {
    const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';

    return (
        <label
            className="relative shrink-0 cursor-pointer group"
            title="Modifier la photo"
        >
            <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onUpload}
                disabled={isUploading}
            />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center">
                {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                ) : photoUrl ? (
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-lg font-semibold text-muted-foreground">{initials}</span>
                )}
            </div>
            {!isUploading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-5 h-5 text-white" />
                </span>
            )}
        </label>
    );
}
