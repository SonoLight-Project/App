import { IUsersDBRecord, IOAuthDBRecord } from "~~/server/types/User";

export interface IApiResponse {
    message: string;
    user: IApiUserPayload;
}

export interface IApiUserPayload {
    userId: IUsersDBRecord["id"];
    userName: IUsersDBRecord["username"];
    userRole: IUsersDBRecord["role"];
    discordUsername: IOAuthDBRecord["discordUsername"];
    githubUsername: IOAuthDBRecord["githubUsername"];
    mcjpgUsername: IOAuthDBRecord["mcjpgUsername"];
}

export interface IApiUserPayloadAdmin extends IApiUserPayload {
    discordId: IOAuthDBRecord["discordId"];
    githubId: IOAuthDBRecord["githubId"];
    mcjpgId: IOAuthDBRecord["mcjpgId"];
}