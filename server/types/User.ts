export interface IUsersDBRecord {
    id: string;
    createAt: string;
    username: string;
    email: string;
    passwordHash: string;
    refreshToken: string | null;
    role: number;
}

export interface IOAuthDBRecord {
    id: string;
    createAt: string;
    discordId: string | null;
    discordUsername: string | null;
    githubId: string | null;
    githubUsername: string | null;
    mcjpgId: string | null;
    mcjpgUsername: string | null;
}