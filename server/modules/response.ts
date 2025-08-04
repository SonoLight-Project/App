import { IApiUserPayload, IApiUserPayloadAdmin } from "~~/server/types/Api";
import { IOAuthDBRecord, IUsersDBRecord } from "~~/server/types/User";

export const wrapUserResponse = (UsersUser: IUsersDBRecord, OAuthUser: IOAuthDBRecord): IApiUserPayload => {
    if (UsersUser.id !== OAuthUser.id) {
        throw new Error("Error when creating user response: provided UsersUser record ID not match with provided OAuthUser record ID");
    }
    return {
        // Base Record
        userId: UsersUser.id,
        userName: UsersUser.userName,
        userRole: UsersUser.userRole,
        // OAuth
        discordUsername: OAuthUser.discordUsername,
        githubUsername: OAuthUser.githubUsername,
        mcjpgUsername: OAuthUser.mcjpgUsername,
    };
};

export const wrapUserResponseAdmin = (UsersUser: IUsersDBRecord, OAuthUser: IOAuthDBRecord): IApiUserPayloadAdmin => {
    return {
        ...wrapUserResponse(UsersUser, OAuthUser),
        discordId: OAuthUser.discordId,
        githubId: OAuthUser.githubId,
        mcjpgId: OAuthUser.mcjpgId,
    };
};
