export type ClienteStatus = 'Ativo' | 'Inativo' | 'Bloqueado';

export interface Cliente
{
    id: number;
    usuarioId?: number;
    nome: string;
    telefone: string;
    email: string;
    instagram: string | null;
    sexo: string | null;
    estado: string | null;
    dataNascimento: string | null;
    descricao: string | null;
    status: ClienteStatus;
    statusCliente?: ClienteStatus;
    dataCadastramento: string | null;
}

export type ClienteFormValues = Omit<Cliente, 'id' | 'usuarioId' | 'statusCliente'>;
