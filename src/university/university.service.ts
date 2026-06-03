import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UniversityDto } from './dto';

@Injectable()
export class UniversityService {
    constructor(private prisma: PrismaService) {}

    async create(dto: UniversityDto) {
        const university = this.prisma.university.create({
            data: {
                name: dto.name
            }
        })
        return university;
    }
}
