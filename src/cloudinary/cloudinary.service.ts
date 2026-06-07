import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
    constructor(private config: ConfigService) {
        cloudinary.config({
            cloud_name: this.config.get("CLOUDINARY_NAME"),
            api_key: this.config.get("CLOUDINARY_API_KEY"),
            api_secret: this.config.get("CLOUDINARY_API_SECRET"),
        })
    }

    async uploadListingImg(file: Express.Multer.File) {
        return new Promise((resolve, reject) => cloudinary.uploader.upload_stream( { folder: "student marketplace/listings" }, (error, result) => {
                if(error) return reject(error);
                resolve(result);
        }).end(file.buffer))
    }

    async deleteImage(publicId: string) {
        return cloudinary.uploader.destroy(publicId);
    }
}
