export interface RegisterInput {
    email: string;
    password: string;
    profilePic?: Express.Multer.File;
}

export interface LoginInput {
    email: string,
    password: string
}


export enum AuthProvider {
    LOCAL = "local",
    GOOGLE = "google",
    GITHUB = "github"
}

import { Request } from "express";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
    files?: any;
    file?: any;
}

