export interface KemonoFile {
    name: string;
    path: string;
}

export interface KemonoAttachment {
    name: string;
    path: string;
}

// Extended attachment info from the new API format
export interface KemonoAttachmentExtended {
    server: string;
    name: string;
    path: string;
    extension?: string;
    name_extension?: string;
    stem?: string;
}

// Preview/thumbnail info from API
export interface KemonoPreview {
    type: string;
    server: string;
    name: string;
    path: string;
}

export interface KemonoPost {
    id: string;
    user: string;
    service: string;
    title: string;
    content: string;
    embed: {
        url?: string;
        subject?: string;
        description?: string;
    };
    shared_file: boolean;
    file: KemonoFile;
    added: string;
    published: string;
    edited: string;
    attachments: KemonoAttachment[];
    next?: string | null;
    prev?: string | null;
    poll?: any;
    captions?: any;
    tags?: string[] | null;
}

// Full API response with extended info
export interface KemonoPostResponse {
    post: KemonoPost;
    attachments?: KemonoAttachmentExtended[];
    previews?: KemonoPreview[];
    videos?: any[];
    props?: {
        flagged?: any;
        revisions?: any[];
    };
}

export interface KemonoPostsResponse {
    posts: KemonoPost[];
    count: number;
    true_count: number;
}

export interface KemonoCreator {
    id: string;
    name: string;
    service: string;
    indexed: number;
    updated: number;
}
