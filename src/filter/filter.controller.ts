import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { FilterService } from './filter.service';
import { FilterDto } from './dto';

@UseGuards(JwtGuard)
@Controller('filters')
export class FilterController {
    constructor(private filterService: FilterService) {}

    @Get()
    filter(@Query() filters: FilterDto) {
        return this.filterService.filter(filters);
    }
}