import { Controller, Param, Post } from '@nestjs/common';
import { ReportService } from './report.service';
import { GetUser } from 'src/auth/decorator';
import type { User } from 'generated/prisma/client';
import { ReportDto } from './dto/report.dto';

@Controller('reports')
export class ReportController {
    constructor(private reportService: ReportService) {}

    @Post(':listingId')
    create(@GetUser() user: User, @Param('listingId') listingId: string, dto: ReportDto) {
        return this.reportService.create(user, listingId, dto);
    }
}
