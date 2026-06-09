import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportDto } from './dto';
import { User } from 'generated/prisma/client';

@Injectable()
export class ReportService {
    constructor(private prismaService: PrismaService) {}

    async create(user: User, listingId: string, dto: ReportDto) {
        const existingReport = await this.prismaService.report.findFirst({
            where: {
                reporterId: user.id,
                listingId,
            },
        });

        if (existingReport) throw new ConflictException('You have already reported this listing');

        const listing = await this.prismaService.listing.findUnique({ where: { id: listingId } });
        if(!listing) throw new NotFoundException("Listing not found");

        await this.prismaService.report.create({ data: { reason: dto.reason, reporterId: user.id, listingId } });
        return { message: "Report created successfully" }
    }

    async findByAdmin() {
        return await this.prismaService.report.findMany({ include: { reporter: {
            select: { id: true, firstName: true, lastName: true, email: true }
        }, listing: { select: { id: true, title: true, seller: { select: { id: true, firstName: true, lastName: true, email: true } } } } }, orderBy: { createdAt: 'desc' }});
    }
}
