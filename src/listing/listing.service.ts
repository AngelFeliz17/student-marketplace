import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListingDto, UpdateListingDto } from './dto';
import { User } from 'generated/prisma/browser';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CloudinaryUploadResult } from 'src/cloudinary/interface';

@Injectable()
export class ListingService {
    constructor(private prisma: PrismaService, private cloudinaryService: CloudinaryService) {}

    async create(dto: ListingDto, seller: User, files: Express.Multer.File[]) {
        if(!files?.length) throw new BadRequestException("At least 1 image is required");

        const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
        if (!category) throw new NotFoundException('Category not found');

       const uploadedImages: CloudinaryUploadResult[] = []; 
       try {
            for(const file of files){ 
                const result = await this.cloudinaryService.uploadListingImg(file) as CloudinaryUploadResult;
                uploadedImages.push(result)
            };

            return await this.prisma.listing.create({ data: { ...dto,  sellerId: seller.id, images: { create: uploadedImages.map((img, idx) => ({
                url: img.secure_url,
                order: idx,
                publicId: img.public_id
            })) } }, include: { category: true, images: { orderBy: { order: 'asc' } }, seller: { omit: { password: true } } } } );
       } catch(error) {
            await Promise.all(
                uploadedImages.map(img => this.cloudinaryService.deleteImage(img.public_id))
            )
            throw error;
       }
    }

    async findMy(user: User) {
        const listings = await this.prisma.listing.findMany({ where: { sellerId: user.id, deletedAt: null }, include: { seller: { omit: { password: true } }, category: true, images: true } });

        return listings;
    }

    async findAll() {
        return await this.prisma.listing.findMany({ where: { deletedAt: null } });
    }

    async find(id: string) {
        const listing = await this.prisma.listing.findFirst({ where: { id, deletedAt: null }, include: { seller: { omit: { password: true } }, category: true, images: true } });
        if(!listing) throw new NotFoundException("Listing not found");

        return listing;
    }

    async update(id: string, dto: UpdateListingDto) {
        const listing = await this.prisma.listing.findFirst({ where: { id, deletedAt: null } });
        if(!listing) throw new NotFoundException("Listing not found")
        return await this.prisma.listing.update({ where: { id }, data: dto });
    }

    async removeImage(id: string) {
        const image = await this.prisma.listingImage.findUnique({ where: { id }, include: { listing: { include: { images: true } } } });

        if(!image) throw new NotFoundException("Image not found");
        if(image.listing.images.length <= 1) throw new BadRequestException("A listing must have at least one image");

        await this.cloudinaryService.deleteImage(image.publicId);

        await this.prisma.listingImage.delete({ where: { id: image.id } })
    }

    async delete(id: string) {
        const listing = await this.prisma.listing.findFirst({ where: { id, deletedAt: null }, include: { images: true } });
        if(!listing) throw new NotFoundException("Listing not found");

        await this.prisma.listing.update({
            where: { id },
            data: { deletedAt: new Date(), status: "ARCHIVED" }
        });
    }

    async permanentlyDelete(id: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
            include: { images: true },
        });

        if (!listing) {
            throw new NotFoundException("Listing not found");
        }

        await Promise.all(
            listing.images.map(img =>
                this.cloudinaryService.deleteImage(img.publicId),
            ),
        );

        await this.prisma.listing.delete({
            where: { id },
        });
    }
}
