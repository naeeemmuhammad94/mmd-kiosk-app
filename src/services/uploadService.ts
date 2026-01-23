/* eslint-disable @typescript-eslint/no-explicit-any */
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadFileToS3 = async (files: any): Promise<UploadResponse> => {
  const formData = new FormData();

  files.forEach((file: any) => {
    formData.append('images', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
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
