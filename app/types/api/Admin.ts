import type { IApiUserDataResponse } from "./Auth";
import type { IApiResponseBase } from "./Base";

export interface IApiAdminUserListResponse extends IApiResponseBase {
    users: IApiUserDataResponse[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface IApiAdminUserCreateResponse extends IApiResponseBase {
    user: IApiUserDataResponse;
}
