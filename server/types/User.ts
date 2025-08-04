export interface IUsersDBRecord {
    id: string;
    createAt: string;
    userName: string;
    userRole: number;
    email: string;
    passwordHash: string;
    refreshToken: string | null;
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
