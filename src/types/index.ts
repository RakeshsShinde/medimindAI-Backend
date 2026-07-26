import { Request } from "express";
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

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
    files?: any;
    file?: any;
}



export interface MedicineLookupData {
    name: string;
    genericName?: string;
    activeIngredient?: string;
    setId: string;
    labeler: string;
    indications: string;
    dosageAndAdmin: string;
    warnings: string;
    contraindications: string;
    adverseReactions: string;
    drugInteractions: string;
    labelUrl: string;
    notFound?: boolean;
}

export interface InteractionPair {
    drug1: string;
    drug2: string;
    severity: "High" | "Moderate" | "Low" | "Unknown";
    description: string;
    source: string;
}


export interface MedicineInteractionData {
    drugsChecked: string[];
    hasInteractions: boolean;
    interactionCount: number;
    interactions: InteractionPair[];
    notFoundDrugs?: string[];
}

export const SECTION_CODES: Record<string, keyof MedicineLookupData> = {
    "51727-6": "activeIngredient",
    "34069-5": "activeIngredient",
    "34067-9": "indications",
    "34068-7": "dosageAndAdmin",
    "34071-1": "warnings",
    "34070-3": "contraindications",
    "34084-4": "adverseReactions",
    "34073-7": "drugInteractions",
};

