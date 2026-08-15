export type StatusVenda = 'Pendente' | 'Em Andamento' | 'Concluída' | 'Cancelada';
export type CanalVenda = 'Facebook' | 'Instagram' | 'WhatsApp' | 'Site' | 'Outros';

export interface ItemVenda
{
    id?: number;
    vendaId?: number;
    produtoId: number;
    quantidade?: number;
    precoUnitario: number;
    produtoNome?: string;
    subtotal?: number;
}

export interface Venda
{
    id: number;
    usuarioId?: number;
    clienteId: number | null;
    clienteNome?: string | null;
    clienteTelefone?: string | null;
    clienteEmail?: string | null;
    dataVenda: string;
    avaliacao: string | null;
    observacao: string | null;
    valorTotal: number;
    quantidade: number;
    canal: CanalVenda | string | null;
    statusVenda: StatusVenda | string;
    itens?: ItemVenda[];
}

export interface VendaFormValues
{
    id?: number;
    clienteId: number | null;
    dataVenda: string;
    avaliacao: string;
    observacao: string;
    quantidade: number;
    canal: CanalVenda | string;
    statusVenda: StatusVenda | string;
    itens: ItemVenda[];
}

export const STATUS_VENDA_OPCOES: { value: StatusVenda; label: StatusVenda }[] = [
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Em Andamento', label: 'Em Andamento' },
    { value: 'Concluída', label: 'Concluída' },
    { value: 'Cancelada', label: 'Cancelada' },
];

export const STATUS_VENDA_FILTRO: { value: '' | StatusVenda; label: string }[] = [
    { value: '', label: 'Status: Todos' },
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Em Andamento', label: 'Em Andamento' },
    { value: 'Concluída', label: 'Concluída' },
    { value: 'Cancelada', label: 'Cancelada' },
];

export const CANAIS_VENDA_OPCOES: { value: CanalVenda; label: CanalVenda }[] = [
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'Site', label: 'Site' },
    { value: 'Outros', label: 'Outros' },
];
