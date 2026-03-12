'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  FileCheck,
  CalendarClock,
  Building2,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  Filter,
  Download,
  Clock,
  Briefcase,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getAllEmployees, getDepartments } from '@/lib/api/employee';
import { getAllContracts } from '@/lib/api/contract';
import { getAllLeaveRequests } from '@/lib/api/leave';
import { Employee, Department } from '@/types/employee';
import { Contract } from '@/types/contract';
import { LeaveRequest } from '@/types/leave';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [empData, deptData, contractData, leaveData] = await Promise.all([
          getAllEmployees().catch(() => []),
          getDepartments().catch(() => []),
          getAllContracts().catch(() => []),
          getAllLeaveRequests().catch(() => [])
        ]);

        const empList = Array.isArray(empData) ? empData : (empData as any)['hydra:member'] || [];
        const deptList = Array.isArray(deptData) ? deptData : (deptData as any)['hydra:member'] || [];
        const contractList = Array.isArray(contractData) ? contractData : (contractData as any)['hydra:member'] || [];
        const leaveList = Array.isArray(leaveData) ? leaveData : (leaveData as any)['hydra:member'] || [];

        setEmployees(empList);
        setDepartments(deptList);
        setContracts(contractList);
        setLeaves(leaveList);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Compute metrics
  const totalEmployees = employees.length;

  // Contract status counts
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const pendingContracts = contracts.filter(c => c.status === 'PENDING').length;
  const endedContracts = contracts.filter(c => c.status === 'ENDED').length;
  const cancelledContracts = contracts.filter(c => c.status === 'CANCELLED').length;

  // Leave requests pending
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
  const totalDepartments = departments.length;

  const getEmployeeName = (idOrIri: string) => {
    if (!idOrIri) return "Collab. Inconnu";
    const empId = idOrIri.split('/').pop();
    const emp = employees.find(e => {
      const eId = (e as any)['@id'] ? (e as any)['@id'].split('/').pop() : e.id;
      return eId === empId || e.id === empId;
    });
    return emp ? `${emp.firstName} ${emp.lastName}` : `Collab. ${empId?.slice(-6)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-secondary-400">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        <p className="font-bold uppercase tracking-widest text-xs">Chargement du dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-secondary-900 uppercase tracking-tighter">Dashboard RH</h1>
          <p className="text-secondary-500 font-medium italic mt-1">Bon retour. Voici l'état de l'organisation en temps réel.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Employés"
          value={totalEmployees}
          badge="+New"
          trend="up"
          color="primary"
          icon={Users}
          description="Effectif global de l'entreprise"
        />
        <StatsCard
          title="Contrats Actifs"
          value={activeContracts}
          badge={`Total: ${contracts.length}`}
          trend="neutral"
          color="emerald"
          icon={FileCheck}
          description={`Attente: ${pendingContracts} • Finis: ${endedContracts} • Annulés: ${cancelledContracts}`}
        />
        <StatsCard
          title="En attente"
          value={pendingLeaves}
          badge="Congés"
          trend="warning"
          color="amber"
          icon={Clock}
          description="Demandes à traiter par les RH"
        />
        <StatsCard
          title="Départements"
          value={totalDepartments}
          badge="Units"
          trend="neutral"
          color="indigo"
          icon={Building2}
          description="Répartition des effectifs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department Distribution */}
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-2xl shadow-secondary-200/40 bg-white rounded-[40px]">
          <CardHeader className="p-8 border-b border-secondary-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">Répartition par Département</CardTitle>
                <CardDescription className="text-sm font-medium italic">Analyse des talents par unité organisationnelle</CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary-50 text-primary-600 border-primary-100 font-black px-4 py-1 rounded-full text-[10px] tracking-widest uppercase">
                Temps Réel
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-secondary-50">
              {departments.length > 0 ? departments.slice(0, 8).map(dept => {
                const deptCount = employees.filter(e => {
                  const deptId = (e.department as any)?.id || (typeof e.department === 'string' && e.department.split('/').pop()) || e.department;
                  return deptId === dept.id || e.department === dept['@id'];
                }).length;
                return (
                  <div key={dept.id} className="p-8 group hover:bg-secondary-50/50 transition-all duration-300">
                    <div className="flex flex-col gap-1 items-center md:items-start">
                      <span className="text-[10px] font-black uppercase text-secondary-400 tracking-[0.2em] mb-2">{dept.name}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-secondary-900 group-hover:text-primary-600 transition-colors tabular-nums">{deptCount}</span>
                        <span className="text-[10px] font-bold text-secondary-300 uppercase">Talents</span>
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div className="p-16 col-span-full flex flex-col items-center justify-center gap-4">
                  <TrendingUp className="w-12 h-12 text-secondary-100 animate-pulse" />
                  <span className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">Aucune donnée disponible</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="border-none shadow-2xl shadow-secondary-200/40 bg-white rounded-[40px]">
          <CardHeader className="p-8 border-b border-secondary-50">
            <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">
              Actions Requises
            </CardTitle>
            <CardDescription className="text-sm font-medium italic">Flux d'approbation prioritaire</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-6 space-y-8">
            <div className="space-y-6">
              {leaves.filter(l => l.status === 'PENDING').slice(0, 3).map((leave, i) => (
                <ActivityItem
                  key={`l-${i}`}
                  user={getEmployeeName(leave.employee)}
                  action="Congé en attente"
                  date={format(new Date(leave.startDate), 'dd MMM yyyy', { locale: fr })}
                  type="leave"
                />
              ))}
              {contracts.filter(c => c.status === 'PENDING').slice(0, 3).map((contract, i) => (
                <ActivityItem
                  key={`c-${i}`}
                  user={getEmployeeName(contract.employee)}
                  action="Nouveau contrat"
                  date={format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })}
                  type="contract"
                />
              ))}
              {(leaves.filter(l => l.status === 'PENDING').length === 0 && contracts.filter(c => c.status === 'PENDING').length === 0) && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <FileCheck className="w-10 h-10 text-secondary-100" />
                  <p className="text-[10px] font-black uppercase text-secondary-300 tracking-widest text-center">Tout est à jour !</p>
                </div>
              )}
            </div>

            <Button variant="ghost" className="w-full text-primary-600 font-black uppercase tracking-widest text-[10px] h-12 rounded-2xl hover:bg-primary-50 transition-all border border-dashed border-primary-100">
              Voir tout l'historique
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, badge, trend, color, icon: Icon, description }: any) {
  const getColors = () => {
    switch (color) {
      case 'emerald': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'amber': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'indigo': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-primary-50 text-primary-600 border-primary-100';
    }
  }

  return (
    <Card className="group relative overflow-hidden border-none shadow-xl shadow-secondary-200/40 bg-white transition-all hover:-translate-y-2 rounded-[32px]">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all">
        <Icon className="w-20 h-20" />
      </div>
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center justify-between">
          <div className={cn("p-2.5 rounded-xl", getColors())}>
            <Icon className="w-5 h-5" />
          </div>
          <Badge
            variant="outline"
            className={cn("font-bold text-[9px] tracking-widest uppercase px-2.5 py-0.5 rounded-full border-none", getColors())}
          >
            {badge}
          </Badge>
        </div>
        <CardTitle className="text-secondary-400 font-black text-[10px] mt-6 uppercase tracking-[0.2em]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="text-4xl font-black text-secondary-900 tabular-nums tracking-tighter mb-1">{value}</div>
        <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-wide opacity-80">{description}</p>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ user, action, date, type }: any) {
  const getIcon = () => {
    switch (type) {
      case 'leave': return <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-4 h-4" /></div>;
      case 'contract': return <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Check className="w-4 h-4" /></div>;
      default: return <div className="p-2 bg-primary-50 text-primary-600 rounded-xl"><Users className="w-4 h-4" /></div>;
    }
  }

  return (
    <div className="flex items-center gap-4 group p-1">
      <div className="shrink-0 transition-transform group-hover:scale-110">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-black text-secondary-900 uppercase text-[10px] tracking-tight truncate">{user}</span>
          <span className="text-[9px] font-black text-secondary-300 uppercase shrink-0">{date}</span>
        </div>
        <p className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest opacity-70 mt-0.5">{action}</p>
      </div>
    </div>
  );
}
