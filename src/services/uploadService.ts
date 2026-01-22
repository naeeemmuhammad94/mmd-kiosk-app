/**
 * Upload Service
 * Handles file uploads to S3 - matching CRM pattern
 */

import axios from './axios';

export interface UploadResponse {
    data: string[];
    status: number;
    message?: string;
}

/**
 * Upload files to S3
 * Matches CRM's uploadFileToS3 implementation
 */
export const uploadFileToS3 = async (files: { uri: string; name: string; type: string }[]): Promise<UploadResponse> => {
    const formData = new FormData();

    files.forEach((file) => {
        formData.append('images', {
            uri: file.uri,
            name: file.name,
            type: file.type,
        } as any);
    });

    const response = await axios.post('/file/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * Helper to get file info from URI
 */
export const getFileInfo = (uri: string): { name: string; type: string } => {
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    return { name: filename, type };
};
