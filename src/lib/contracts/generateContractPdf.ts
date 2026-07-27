import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CONTRACT_STATUS, CONTRACT_TYPE, type Contract } from '@/types/contract';
import type { Employee } from '@/types/employee';

const STATUS_LABELS: Record<string, string> = {
    [CONTRACT_STATUS.ACTIVE]: 'Actif',
    [CONTRACT_STATUS.PENDING]: 'En attente',
    [CONTRACT_STATUS.ENDED]: 'Terminé',
    [CONTRACT_STATUS.CANCELLED]: 'Annulé',
};

const TYPE_LABELS: Record<string, string> = {
    [CONTRACT_TYPE.CDI]: 'CDI',
    [CONTRACT_TYPE.CDD]: 'CDD',
    [CONTRACT_TYPE.INTERNSHIP]: 'Stage',
    [CONTRACT_TYPE.CONSULTANT]: 'Consultant',
};

function formatDate(value?: string | null, fallback = 'Indéterminé') {
    if (!value) return fallback;
    try {
        return format(new Date(value), 'd MMMM yyyy', { locale: fr });
    } catch {
        return fallback;
    }
}

function formatSalary(value?: string | null) {
    const amount = parseInt(value || '0', 10);
    return `${amount.toLocaleString('fr-FR')} CDF`;
}

export function generateContractPdf(contract: Contract, employee?: Employee | null) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 22;

    const primary = [37, 99, 235] as const;
    const secondary = [100, 116, 139] as const;
    const dark = [15, 23, 42] as const;

    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, pageWidth, 3, 'F');
    doc.setFillColor(220, 38, 38);
    doc.rect(pageWidth / 3, 0, pageWidth / 3, 3, 'F');
    doc.setFillColor(234, 179, 8);
    doc.rect((pageWidth / 3) * 2, 0, pageWidth / 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text('ARCA SIRH', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(secondary[0], secondary[1], secondary[2]);
    doc.text('Fiche contractuelle', margin, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text(`Contrat #${contract.id.slice(0, 8).toUpperCase()}`, pageWidth - margin, y, { align: 'right' });

    y += 18;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const employeeName = employee
        ? `${employee.firstName} ${employee.lastName}`
        : 'Collaborateur non renseigné';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(employeeName, margin, y);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(secondary[0], secondary[1], secondary[2]);
    if (employee?.employeeNumber) {
        doc.text(`Matricule : ${employee.employeeNumber}`, margin, y);
        y += 5;
    }
    if (employee?.email) {
        doc.text(`Email : ${employee.email}`, margin, y);
        y += 5;
    }

    y += 6;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 88, 3, 3, 'F');

    const rows: [string, string][] = [
        ['Type de contrat', TYPE_LABELS[contract.type] || contract.type],
        ['Statut', STATUS_LABELS[contract.status] || contract.status],
        ['Rémunération mensuelle', formatSalary(contract.salary)],
        ['Date de début', formatDate(contract.startDate)],
        ['Date de fin', formatDate(contract.endDate, 'Indéterminé')],
        ['Créé le', formatDate(contract.createdAt)],
    ];

    let rowY = y + 8;
    rows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(secondary[0], secondary[1], secondary[2]);
        doc.text(label.toUpperCase(), margin + 4, rowY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.text(value, margin + 4, rowY + 5);
        rowY += 14;
    });

    y += 96;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text('Informations complémentaires', margin, y);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(secondary[0], secondary[1], secondary[2]);

    const details = [
        `Référence complète : ${contract.id}`,
        contract.activatedAt ? `Activé le : ${formatDate(contract.activatedAt)}` : null,
        contract.endedAt ? `Terminé le : ${formatDate(contract.endedAt)}` : null,
        contract.cancelledAt ? `Annulé le : ${formatDate(contract.cancelledAt)}` : null,
    ].filter(Boolean) as string[];

    details.forEach((line) => {
        doc.text(`• ${line}`, margin, y);
        y += 6;
    });

    y = 250;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(secondary[0], secondary[1], secondary[2]);
    doc.text(
        `Document généré le ${format(new Date(), "d MMMM yyyy 'à' HH:mm", { locale: fr })} — ARCA SIRH`,
        margin,
        y,
    );

    doc.save(`contrat-${contract.id.slice(0, 8).toLowerCase()}.pdf`);
}
