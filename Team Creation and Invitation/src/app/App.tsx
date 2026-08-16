import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  Users,
  Plus,
  Check,
  X,
  LayoutDashboard,
  UserRound,
  Package,
  TrendingUp,
  CheckSquare,
  Settings,
  LogOut,
  BarChart2,
  ChevronLeft,
  Building2,
  Target,
  Calendar,
  UserPlus,
  Crown,
  Clock,
  Hash,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────
type MemberStatus = "pendente" | "aceito" | "recusado";

interface AppUser {
  id: number;
  nome: string;
  codigo: string;
  funcao: string;
  initials: string;
  color: string;
}

interface TeamMember {
  userId: number;
  status: MemberStatus;
  dataConvite: string;
}

interface Team {
  id: number;
  nome: string;
  descricao: string;
  criadoPor: number;
  setor: string;
  objetivo: string;
  dataCriacao: string;
  membros: TeamMember[];
}

interface Notification {
  id: number;
  equipeId: number;
  equipaNome: string;
  criadoPorNome: string;
  descricaoEquipe: string;
  lida: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CURRENT_USER_ID = 1;

const ALL_USERS: AppUser[] = [
  { id: 1, nome: "Angela", codigo: "65761", funcao: "Recepcionista", initials: "AN", color: "#2D5AE0" },
  { id: 2, nome: "Carlos Silva", codigo: "32847", funcao: "Vendedor", initials: "CS", color: "#E53E3E" },
  { id: 3, nome: "Maria Santos", codigo: "91023", funcao: "Analista", initials: "MS", color: "#38A169" },
  { id: 4, nome: "João Pereira", codigo: "47562", funcao: "Gerente", initials: "JP", color: "#D69E2E" },
  { id: 5, nome: "Fernanda Lima", codigo: "88134", funcao: "Suporte", initials: "FL", color: "#805AD5" },
  { id: 6, nome: "Roberto Costa", codigo: "55391", funcao: "Técnico", initials: "RC", color: "#DD6B20" },
];

const INITIAL_TEAMS: Team[] = [
  {
    id: 1,
    nome: "Time de Vendas",
    descricao: "Equipe responsável pelas metas de vendas mensais e atendimento ao cliente premium.",
    criadoPor: 1,
    setor: "Comercial",
    objetivo: "Aumentar vendas em 20%",
    dataCriacao: "2024-01-15",
    membros: [
      { userId: 1, status: "aceito", dataConvite: "2024-01-15" },
      { userId: 2, status: "pendente", dataConvite: "2024-01-16" },
      { userId: 3, status: "aceito", dataConvite: "2024-01-15" },
    ],
  },
  {
    id: 2,
    nome: "Equipe de Marketing",
    descricao: "Time dedicado a campanhas de marketing digital e crescimento de marca no mercado.",
    criadoPor: 4,
    setor: "Marketing",
    objetivo: "Expansão de mercado",
    dataCriacao: "2024-01-10",
    membros: [
      { userId: 4, status: "aceito", dataConvite: "2024-01-10" },
      { userId: 1, status: "pendente", dataConvite: "2024-01-17" },
      { userId: 5, status: "aceito", dataConvite: "2024-01-10" },
    ],
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    equipeId: 2,
    equipaNome: "Equipe de Marketing",
    criadoPorNome: "João Pereira",
    descricaoEquipe: "Time dedicado a campanhas de marketing digital e crescimento de marca no mercado.",
    lida: false,
  },
];

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<MemberStatus, { label: string; bg: string; color: string }> = {
  aceito: { label: "Ativo", bg: "#F0FDF4", color: "#16A34A" },
  pendente: { label: "Pendente", bg: "#FFFBEB", color: "#B45309" },
  recusado: { label: "Recusado", bg: "#FEF2F2", color: "#E53E3E" },
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  // Create team form
  const [newTeam, setNewTeam] = useState({ nome: "", descricao: "", setor: "", objetivo: "" });
  const [userSearch, setUserSearch] = useState("");
  const [selectedInvites, setSelectedInvites] = useState<AppUser[]>([]);

  // Add member to existing team
  const [addMemberSearch, setAddMemberSearch] = useState("");

  const notifPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [notifOpen]);

  const unreadCount = notifications.filter((n) => !n.lida).length;

  // Angela sees teams she created OR accepted
  const visibleTeams = teams.filter(
    (t) =>
      t.criadoPor === CURRENT_USER_ID ||
      t.membros.some((m) => m.userId === CURRENT_USER_ID && m.status === "aceito")
  );

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;

  const userSearchResults =
    userSearch.trim().length >= 1
      ? ALL_USERS.filter(
          (u) =>
            u.id !== CURRENT_USER_ID &&
            !selectedInvites.find((s) => s.id === u.id) &&
            (u.nome.toLowerCase().includes(userSearch.toLowerCase()) || u.codigo.includes(userSearch))
        )
      : [];

  const addMemberResults =
    addMemberSearch.trim().length >= 1 && selectedTeam
      ? ALL_USERS.filter(
          (u) =>
            u.id !== CURRENT_USER_ID &&
            !selectedTeam.membros.find((m) => m.userId === u.id) &&
            (u.nome.toLowerCase().includes(addMemberSearch.toLowerCase()) || u.codigo.includes(addMemberSearch))
        )
      : [];

  function getUser(id: number) {
    return ALL_USERS.find((u) => u.id === id);
  }

  function handleCreateTeam() {
    if (!newTeam.nome.trim()) return;
    const newId = Math.max(...teams.map((t) => t.id)) + 1;
    const today = new Date().toISOString().split("T")[0];
    const created: Team = {
      id: newId,
      nome: newTeam.nome,
      descricao: newTeam.descricao,
      criadoPor: CURRENT_USER_ID,
      setor: newTeam.setor,
      objetivo: newTeam.objetivo,
      dataCriacao: today,
      membros: [
        { userId: CURRENT_USER_ID, status: "aceito", dataConvite: today },
        ...selectedInvites.map((u) => ({ userId: u.id, status: "pendente" as MemberStatus, dataConvite: today })),
      ],
    };
    setTeams((prev) => [...prev, created]);
    setNewTeam({ nome: "", descricao: "", setor: "", objetivo: "" });
    setSelectedInvites([]);
    setUserSearch("");
    setCreateOpen(false);
    setSelectedTeamId(newId);
  }

  function handleAcceptInvite(notif: Notification) {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === notif.equipeId
          ? { ...t, membros: t.membros.map((m) => (m.userId === CURRENT_USER_ID ? { ...m, status: "aceito" } : m)) }
          : t
      )
    );
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    setNotifOpen(false);
  }

  function handleDeclineInvite(notif: Notification) {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === notif.equipeId
          ? { ...t, membros: t.membros.map((m) => (m.userId === CURRENT_USER_ID ? { ...m, status: "recusado" } : m)) }
          : t
      )
    );
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
  }

  function handleAddMemberToTeam(user: AppUser) {
    if (!selectedTeam) return;
    const today = new Date().toISOString().split("T")[0];
    setTeams((prev) =>
      prev.map((t) =>
        t.id === selectedTeam.id
          ? { ...t, membros: [...t.membros, { userId: user.id, status: "pendente", dataConvite: today }] }
          : t
      )
    );
    setAddMemberSearch("");
    setAddMemberOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col h-full w-52 shrink-0"
        style={{ background: "#0B0F38", color: "white", fontFamily: "Inter, sans-serif" }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <span className="text-xl font-extrabold tracking-tight select-none">
            <span className="text-white">Plainness</span>
            <span style={{ color: "#E53E3E" }}>CRM</span>
          </span>
        </div>

        {/* User block */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "#2D5AE0" }}
            >
              AN
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Angela</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                Recepcionista
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Código:
                </span>
                <span
                  className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "#E53E3E" }}
                >
                  65761
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Menu
          </p>
          {[
            { icon: LayoutDashboard, label: "Dashboard" },
            { icon: UserRound, label: "Clientes" },
            { icon: Package, label: "Produtos" },
            { icon: TrendingUp, label: "Vendas" },
            { icon: CheckSquare, label: "Tarefas" },
            { icon: Users, label: "Equipes", active: true },
            { icon: BarChart2, label: "Relatórios" },
          ].map(({ icon: Icon, label, active }) => (
            <SidebarItem key={label} icon={<Icon size={17} />} label={label} active={!!active} />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <SidebarItem icon={<Settings size={17} />} label="Configurações" />
          <SidebarItem icon={<LogOut size={17} />} label="Sair" />
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-black/8 px-6 py-3 flex items-center gap-4 shrink-0 z-20">
          <div className="flex-1 relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes, produtos, vendas..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-primary/25 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Bell with notification panel */}
            <div className="relative" ref={notifPanelRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: "#E53E3E" }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-black/8 z-50 overflow-hidden"
                  style={{ boxShadow: "0 20px 60px rgba(11,15,56,0.15)" }}
                >
                  <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900">Notificações</h3>
                    {unreadCount > 0 && (
                      <span
                        className="text-[11px] font-bold text-white px-2 py-0.5 rounded-full"
                        style={{ background: "#E53E3E" }}
                      >
                        {unreadCount} novo{unreadCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <Bell size={30} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400 font-medium">Sem notificações</p>
                      <p className="text-xs text-gray-300 mt-1">Convites de equipe aparecem aqui</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((notif) => (
                        <NotificationCard
                          key={notif.id}
                          notif={notif}
                          onAccept={() => handleAcceptInvite(notif)}
                          onDecline={() => handleDeclineInvite(notif)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-2 pl-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "#2D5AE0" }}
              >
                AN
              </div>
              <span className="text-sm font-medium text-gray-700">Angela</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {selectedTeam ? (
            <TeamDetailView
              team={selectedTeam}
              getUser={getUser}
              currentUserId={CURRENT_USER_ID}
              onBack={() => { setSelectedTeamId(null); setAddMemberOpen(false); setAddMemberSearch(""); }}
              addMemberOpen={addMemberOpen}
              setAddMemberOpen={setAddMemberOpen}
              addMemberSearch={addMemberSearch}
              setAddMemberSearch={setAddMemberSearch}
              addMemberResults={addMemberResults}
              onAddMember={handleAddMemberToTeam}
            />
          ) : (
            <TeamsListView
              visibleTeams={visibleTeams}
              currentUserId={CURRENT_USER_ID}
              getUser={getUser}
              onSelectTeam={setSelectedTeamId}
              onCreateTeam={() => setCreateOpen(true)}
              pendingInvitesCount={notifications.length}
              onOpenNotifs={() => setNotifOpen(true)}
            />
          )}
        </main>
      </div>

      {/* ── Create Team Dialog ────────────────────────────────────────────── */}
      <Dialog.Root open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setNewTeam({ nome: "", descricao: "", setor: "", objetivo: "" }); setSelectedInvites([]); setUserSearch(""); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-2xl p-6"
            style={{ boxShadow: "0 24px 80px rgba(11,15,56,0.18)" }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">Nova Equipe</Dialog.Title>
                <p className="text-sm text-gray-400 mt-0.5">Crie uma equipe e convide colaboradores</p>
              </div>
              <Dialog.Close asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
                  <X size={17} />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <FormField label="Nome da equipe *">
                <input
                  type="text"
                  value={newTeam.nome}
                  onChange={(e) => setNewTeam((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Time de Vendas"
                  className="form-input"
                />
              </FormField>

              <FormField label="Descrição">
                <textarea
                  value={newTeam.descricao}
                  onChange={(e) => setNewTeam((p) => ({ ...p, descricao: e.target.value }))}
                  placeholder="Descreva o objetivo desta equipe..."
                  rows={3}
                  className="form-input resize-none"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Setor">
                  <input
                    type="text"
                    value={newTeam.setor}
                    onChange={(e) => setNewTeam((p) => ({ ...p, setor: e.target.value }))}
                    placeholder="Ex: Comercial"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Objetivo">
                  <input
                    type="text"
                    value={newTeam.objetivo}
                    onChange={(e) => setNewTeam((p) => ({ ...p, objetivo: e.target.value }))}
                    placeholder="Ex: Aumentar vendas"
                    className="form-input"
                  />
                </FormField>
              </div>

              {/* Member search */}
              <FormField label="Adicionar membros">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome de usuário ou código..."
                    className="form-input pl-9"
                  />
                </div>

                {userSearchResults.length > 0 && (
                  <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    {userSearchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedInvites((p) => [...p, u]); setUserSearch(""); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 text-left"
                      >
                        <Avatar user={u} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{u.nome}</p>
                          <p className="text-xs text-gray-400">
                            {u.funcao} · <Hash size={10} className="inline -mt-0.5" />
                            {u.codigo}
                          </p>
                        </div>
                        <Plus size={14} style={{ color: "#2D5AE0" }} />
                      </button>
                    ))}
                  </div>
                )}

                {userSearch.trim().length > 0 && userSearchResults.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-3">Nenhum usuário encontrado</p>
                )}

                {selectedInvites.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Selecionados ({selectedInvites.length})
                    </p>
                    {selectedInvites.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl"
                        style={{ background: "#EEF2FF" }}
                      >
                        <Avatar user={u} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{u.nome}</p>
                          <p className="text-xs text-gray-400">{u.funcao}</p>
                        </div>
                        <button
                          onClick={() => setSelectedInvites((p) => p.filter((x) => x.id !== u.id))}
                          className="p-1 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <X size={13} className="text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
              <Dialog.Close asChild>
                <button className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                onClick={handleCreateTeam}
                disabled={!newTeam.nome.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#2D5AE0" }}
              >
                Criar Equipe
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ─── Sidebar item ──────────────────────────────────────────────────────────────
function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
      style={
        active
          ? { background: "#2D5AE0", color: "white" }
          : { color: "rgba(255,255,255,0.65)", background: "transparent" }
      }
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user, size = "md" }: { user: AppUser; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : size === "lg" ? "w-11 h-11 text-sm" : "w-9 h-9 text-xs";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: user.color }}
    >
      {user.initials}
    </div>
  );
}

// ─── Form field wrapper ────────────────────────────────────────────────────────
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}

      <style>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.625rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: Inter, sans-serif;
          color: #111827;
          background: white;
        }
        .form-input:focus {
          border-color: #2D5AE0;
          box-shadow: 0 0 0 3px rgba(45,90,224,0.12);
        }
        .form-input::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

// ─── Notification card ─────────────────────────────────────────────────────────
function NotificationCard({
  notif,
  onAccept,
  onDecline,
}: {
  notif: Notification;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#EEF2FF" }}
        >
          <Users size={18} style={{ color: "#2D5AE0" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Convite de equipe</p>
          <p className="font-bold text-sm text-gray-900">{notif.equipaNome}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Convidado por{" "}
            <span className="font-semibold text-gray-700">{notif.criadoPorNome}</span>
          </p>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-2">
            {notif.descricaoEquipe}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#38A169" }}
        >
          <Check size={14} />
          Aceitar
        </button>
        <button
          onClick={onDecline}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#E53E3E" }}
        >
          <X size={14} />
          Recusar
        </button>
      </div>
    </div>
  );
}

// ─── Teams List View ──────────────────────────────────────────────────────────
function TeamsListView({
  visibleTeams,
  currentUserId,
  getUser,
  onSelectTeam,
  onCreateTeam,
  pendingInvitesCount,
  onOpenNotifs,
}: {
  visibleTeams: Team[];
  currentUserId: number;
  getUser: (id: number) => AppUser | undefined;
  onSelectTeam: (id: number) => void;
  onCreateTeam: () => void;
  pendingInvitesCount: number;
  onOpenNotifs: () => void;
}) {
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Colaboradores</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#0B0F38" }}>
              Equipes
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Gerencie membros, permissões e times da sua operação.
            </p>
          </div>
          <button
            onClick={onCreateTeam}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all shrink-0"
            style={{ background: "#2D5AE0", boxShadow: "0 4px 16px rgba(45,90,224,0.25)" }}
          >
            <Plus size={16} />
            Nova Equipe
          </button>
        </div>
      </div>

      {/* Pending invite banner */}
      {pendingInvitesCount > 0 && (
        <button
          onClick={onOpenNotifs}
          className="w-full mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-left hover:opacity-80 transition-opacity"
          style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#FEF3C7" }}
          >
            <Bell size={15} style={{ color: "#D97706" }} />
          </div>
          <p className="text-sm" style={{ color: "#92400E" }}>
            Você tem{" "}
            <strong>
              {pendingInvitesCount} convite{pendingInvitesCount > 1 ? "s" : ""} de equipe pendente
              {pendingInvitesCount > 1 ? "s" : ""}
            </strong>
            . Clique para visualizar e responder.
          </p>
        </button>
      )}

      {/* Empty state */}
      {visibleTeams.length === 0 ? (
        <div className="bg-white rounded-2xl p-14 text-center border border-black/5 shadow-sm">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "#EEF2FF" }}
          >
            <Users size={28} style={{ color: "#2D5AE0" }} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhuma equipe ainda</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            Crie sua primeira equipe e comece a colaborar com outros membros da plataforma.
          </p>
          <button
            onClick={onCreateTeam}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-colors"
            style={{ background: "#2D5AE0" }}
          >
            <Plus size={15} />
            Criar primeira equipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleTeams.map((team) => {
            const isCreator = team.criadoPor === currentUserId;
            const accepted = team.membros.filter((m) => m.status === "aceito");
            const pending = team.membros.filter((m) => m.status === "pendente");
            const preview = team.membros.slice(0, 5);

            return (
              <button
                key={team.id}
                onClick={() => onSelectTeam(team.id)}
                className="bg-white rounded-2xl p-5 text-left border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#EEF2FF" }}
                    >
                      <Users size={17} style={{ color: "#2D5AE0" }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">
                        {team.nome}
                      </h3>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#EEF2FF", color: "#2D5AE0" }}
                      >
                        {team.setor || "—"}
                      </span>
                    </div>
                  </div>
                  {isCreator && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                      style={{ background: "#FEF3C7", color: "#92400E" }}
                    >
                      Criador
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">{team.descricao}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {preview.map((m, i) => {
                        const u = getUser(m.userId);
                        if (!u) return null;
                        return (
                          <div
                            key={m.userId}
                            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ background: u.color, zIndex: preview.length - i }}
                            title={`${u.nome} (${m.status})`}
                          >
                            {u.initials}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-xs text-gray-400">
                      {accepted.length} membro{accepted.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {pending.length > 0 && isCreator && (
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: "#FFFBEB", color: "#B45309" }}
                    >
                      <Clock size={9} />
                      {pending.length} pendente{pending.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Team Detail View ─────────────────────────────────────────────────────────
function TeamDetailView({
  team,
  getUser,
  currentUserId,
  onBack,
  addMemberOpen,
  setAddMemberOpen,
  addMemberSearch,
  setAddMemberSearch,
  addMemberResults,
  onAddMember,
}: {
  team: Team;
  getUser: (id: number) => AppUser | undefined;
  currentUserId: number;
  onBack: () => void;
  addMemberOpen: boolean;
  setAddMemberOpen: (v: boolean) => void;
  addMemberSearch: string;
  setAddMemberSearch: (v: string) => void;
  addMemberResults: AppUser[];
  onAddMember: (user: AppUser) => void;
}) {
  const isCreator = team.criadoPor === currentUserId;
  const accepted = team.membros.filter((m) => m.status === "aceito").length;
  const pending = team.membros.filter((m) => m.status === "pendente").length;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors"
      >
        <ChevronLeft size={16} />
        Voltar para Equipes
      </button>

      {/* Team header card */}
      <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm mb-4">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "#EEF2FF" }}
          >
            <Users size={24} style={{ color: "#2D5AE0" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-xl font-extrabold" style={{ color: "#0B0F38" }}>
                {team.nome}
              </h2>
              {isCreator && (
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: "#FEF3C7", color: "#92400E" }}
                >
                  Sua equipe
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{team.descricao}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-5 pt-5 border-t border-gray-100">
          <MetaItem icon={<Building2 size={14} />} label="Setor" value={team.setor || "—"} />
          <MetaItem icon={<Target size={14} />} label="Objetivo" value={team.objetivo || "—"} />
          <MetaItem icon={<Calendar size={14} />} label="Criada em" value={team.dataCriacao} />
        </div>
      </div>

      {/* Members card */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Membros da equipe</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {accepted} ativo{accepted !== 1 ? "s" : ""}
              {pending > 0 && ` · ${pending} pendente${pending > 1 ? "s" : ""}`}
            </p>
          </div>
          {isCreator && (
            <button
              onClick={() => setAddMemberOpen(!addMemberOpen)}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all"
              style={{ background: "#2D5AE0" }}
            >
              <UserPlus size={14} />
              Adicionar membro
            </button>
          )}
        </div>

        {/* Add member search bar */}
        {addMemberOpen && (
          <div className="px-6 py-4 border-b border-gray-100" style={{ background: "#F8FAFF" }}>
            <div className="flex gap-3 mb-3">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={addMemberSearch}
                  onChange={(e) => setAddMemberSearch(e.target.value)}
                  placeholder="Buscar por nome de usuário ou código de compartilhamento..."
                  className="form-input pl-9"
                />
              </div>
              <button
                onClick={() => { setAddMemberOpen(false); setAddMemberSearch(""); }}
                className="p-2.5 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <X size={15} className="text-gray-400" />
              </button>
            </div>

            {addMemberResults.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {addMemberResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onAddMember(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 text-left"
                  >
                    <Avatar user={u} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{u.nome}</p>
                      <p className="text-xs text-gray-400">
                        {u.funcao} · <Hash size={10} className="inline -mt-0.5" />
                        {u.codigo}
                      </p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "#2D5AE0" }}>
                      Convidar
                    </span>
                  </button>
                ))}
              </div>
            )}

            {addMemberSearch.trim().length > 0 && addMemberResults.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">Nenhum usuário encontrado</p>
            )}
          </div>
        )}

        {/* Members list */}
        <div className="divide-y divide-gray-50">
          {team.membros.map((member) => {
            const u = getUser(member.userId);
            if (!u) return null;
            const isTeamCreator = member.userId === team.criadoPor;
            const sc = STATUS_CONFIG[member.status];

            return (
              <div key={member.userId} className="px-6 py-4 flex items-center gap-4">
                <Avatar user={u} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{u.nome}</p>
                    {isTeamCreator && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                        style={{ background: "#FEF3C7", color: "#92400E" }}
                      >
                        <Crown size={9} />
                        Criador
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {u.funcao} · <Hash size={9} className="inline -mt-0.5" />
                    {u.codigo}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-300 hidden sm:block">Convidado em {member.dataConvite}</span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: sc.bg, color: sc.color }}
                  >
                    {sc.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline style for form-input used in the add member section */}
      <style>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.625rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: Inter, sans-serif;
          color: #111827;
          background: white;
        }
        .form-input:focus {
          border-color: #2D5AE0;
          box-shadow: 0 0 0 3px rgba(45,90,224,0.12);
        }
        .form-input::placeholder { color: #9ca3af; }
      `}</style>
    </div>
  );
}

// ─── Meta item ────────────────────────────────────────────────────────────────
function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-300">{icon}</span>
      <div>
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-700">{value}</p>
      </div>
    </div>
  );
}
