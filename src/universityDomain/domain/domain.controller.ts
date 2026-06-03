import { Body, Controller, Post } from '@nestjs/common';
import { DomainService } from './domain.service';
import { DomainDto } from './dto/domain.dto';

@Controller('domain')
export class DomainController {
    constructor( private domainServices: DomainService ) {}

    @Post('add')
    create(@Body() dto: DomainDto) {
        return this.domainServices.create(dto)
    } 
}
 