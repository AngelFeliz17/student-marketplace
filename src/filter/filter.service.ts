import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterDto } from './dto';

@Injectable()
        export class FilterService {
            constructor(private prismaService: PrismaService) {}

            async filter(filters: FilterDto) {
                const where: any = {
                    deletedAt: null,
                };

                if (filters.categoryId && filters.categoryId.trim() !== '') {
                    where.categoryId = filters.categoryId;
                }

                if (filters.condition && filters.condition.trim() !== '') {
                    where.condition = filters.condition;
                }

                if (filters.minPrice || filters.maxPrice) {
                    where.price = {};
                    if (filters.minPrice) {
                        where.price.gte = Number(filters.minPrice);
                    }
                    if (filters.maxPrice) {
                        where.price.lte = Number(filters.maxPrice);
                    }
                }

                if (filters.search && filters.search.trim() !== '') {
                    where.OR = [
                    {
                        title: {
                        contains: filters.search,
                        mode: 'insensitive',
                        },
                    },
                    {
                        description: {
                        contains: filters.search,
                        mode: 'insensitive',
                        },
                    },
                    ];
                }
                
                return this.prismaService.listing.findMany({
                    where,
                    orderBy: {
                    createdAt: 'desc',
                    },
                });
        }
}