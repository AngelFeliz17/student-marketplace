import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { GetUser } from 'src/auth/decorator';
import type { User } from 'generated/prisma/client';
import { ReportDto } from './dto';
import { JwtGuard } from 'src/auth/guard';
import { AdminGuard } from 'src/user/guard';

@UseGuards(JwtGuard)
@Controller('reports')
export class ReportController {
    constructor(private reportService: ReportService) {}

    @Post(':listingId')
    create(@GetUser() user: User, @Param('listingId') listingId: string, @Body() dto: ReportDto) {
        return this.reportService.create(user, listingId, dto);
    }

    @UseGuards(AdminGuard)
    @Get()
    findByAdmin() {
        return this.reportService.findByAdmin();
    }
}