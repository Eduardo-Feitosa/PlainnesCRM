export type StatusMembro = 'pendente' | 'ativo' | 'recusado';

export interface Equipe
{
    id: number;
    nome: string;
    descricao: string | null;
    setor: string | null;
    objetivo: string | null;
    criadoPor: number;
    souCriador: boolean;
    dataCriacao: string;
    totalMembros?: number;
}

export type EquipeFormValues = Pick<Equipe, 'nome' | 'descricao' | 'setor' | 'objetivo'>;

export interface MembroEquipe
{
    equipeId: number;
    usuarioId: number;
    nome: string;
    nomeUser: string | null;
    codigo: number | null;
    funcao: string | null;
    status: StatusMembro;
    dataConvite: string;
    dataResposta: string | null;
    ehCriador: boolean;
}

export interface ConviteEquipe
{
    equipeId: number;
    equipeNome: string;
    equipeDescricao: string | null;
    criadoPorNome: string;
    dataConvite: string;
}

export interface UsuarioBusca
{
    id: number;
    nome: string;
    nomeUser: string | null;
    codigo: number | null;
    funcao: string | null;
    tipoPerfil: 'publico' | 'privado';
}
