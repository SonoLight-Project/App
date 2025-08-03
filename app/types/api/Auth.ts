import type { IApiResponseBase } from "~/types/api/Base";

export interface IApiUserDataResponse extends IApiResponseBase {
    user: {
        userId: string;
        userName: string;
        userRole: number;
        discordUsername: string;
        githubUsername: string;
        mcjpgUsername: string;
    };
}
