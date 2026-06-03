import { Body, Controller, Post } from '@nestjs/common';
import { UniversityService } from './university.service';
import { UniversityDto } from './dto';

@Controller('university')
export class UniversityController {
    constructor(private universityService: UniversityService) {}

    @Post('add')
    async create(@Body() dto: UniversityDto) {
        return this.universityService.create(dto)
    }

}
