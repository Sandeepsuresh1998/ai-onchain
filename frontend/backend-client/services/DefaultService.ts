/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageToTextRequest } from '../models/ImageToTextRequest';
import type { ImageToTextResponse } from '../models/ImageToTextResponse';
import type { IpfsImageUploadRequest } from '../models/IpfsImageUploadRequest';
import type { IpfsImageUploadResponse } from '../models/IpfsImageUploadResponse';
import type { IpfsMetadataUploadRequest } from '../models/IpfsMetadataUploadRequest';
import type { IpfsMetadataUploadResponse } from '../models/IpfsMetadataUploadResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class DefaultService {

    /**
     * Stable Diffusion
     * Generate an image from a text prompt using the stable-diffusion model
     * @param requestBody
     * @returns ImageToTextResponse Successful Response
     * @throws ApiError
     */
    public static generateDalle2ImagePost(
        requestBody: ImageToTextRequest,
    ): CancelablePromise<ImageToTextResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/img2txt',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                422: `Validation Error`,
            },
        });
    }

    /**
     * Upload Image To Ipfs
     * @param requestBody
     * @returns IpfsImageUploadResponse Successful Response
     * @throws ApiError
     */
    public static uploadImageToIpfsUploadImagePost(
        requestBody: IpfsImageUploadRequest,
    ): CancelablePromise<IpfsImageUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/upload_image',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Upload Metadata To Ipfs
     * @param requestBody
     * @returns IpfsMetadataUploadResponse Successful Response
     * @throws ApiError
     */
    public static uploadMetadataToIpfsUploadMetadataPost(
        requestBody: IpfsMetadataUploadRequest,
    ): CancelablePromise<IpfsMetadataUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/upload_metadata',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

}
