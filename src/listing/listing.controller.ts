import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ListingService } from './listing.service';
import { JwtGuard } from 'src/auth/guard';
import { ListingDto, UpdateListingDto } from './dto';
import { GetUser } from 'src/auth/decorator';
import type { User } from 'generated/prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from 'src/user/guard';

@UseGuards(JwtGuard)
@Controller('listings')
export class ListingController {
    constructor(private listingService: ListingService) {}

    @Post()
    @UseInterceptors(FilesInterceptor('images', 10))
    create(@Body() dto: ListingDto, @GetUser() seller: User, @UploadedFiles() files: Express.Multer.File[]) {
        return this.listingService.create(dto, seller, files);
    }

    @Get()
    findAll() {
        return this.listingService.findAll();
    }

    @Get(':id')
    find(@Param('id') id: string) {
        return this.listingService.find(id);
    }

    @Get('my')
    findMy(@GetUser() user: User) {
        return this.listingService.findMy(user);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
        return this.listingService.update(id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.listingService.delete(id);
    }

    @Delete('image/:id')
    removeImage(@Param('id') id: string) {
        return this.listingService.removeImage(id);
    }

    @UseGuards(AdminGuard)
    @Delete('permanently/:id')
    permanentlyDelete(@Param('id') id: string) {
        return this.listingService.permanentlyDelete(id);
    }
}
