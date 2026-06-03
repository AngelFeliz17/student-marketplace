import { Injectable } from '@nestjs/common';
import { DomainDto } from './dto/domain.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DomainService {
    constructor(private prisma: PrismaService) {}

    async create(dto: DomainDto) {
        const domain = this.prisma.emailDomain.create({
            data: {
                domain: dto.domain,
                universityId: dto.universityId
            }
        });
            return domain;
        }
}


