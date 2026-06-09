import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConversationService {
    constructor(private prismaService: PrismaService) {}

    async start(user: User, listingId: string) {
        const listing = await this.prismaService.listing.findFirst({ where: { id: listingId, deletedAt: null } });
        if(!listing) throw new NotFoundException('Listing not found');
        if(listing.sellerId === user.id) throw new BadRequestException("You cannot start a conversation with your own listing");
        
        return await this.prismaService.conversation.upsert({ where: { listingId_buyerId: { buyerId: user.id, listingId } }, create: { buyerId: user.id, listingId }, update: {}, include: { listing: { select: { id: true, title: true, price: true, seller: { select: { id: true, firstName: true, lastName: true, profilePicture: true } }} } } });
    }

    async findAll(user: User) {
        return await this.prismaService.conversation.findMany({ where: { OR:[ { buyerId: user.id }, { listing: { sellerId: user.id } }]}, include: { buyer: { select: { id: true, firstName: true, lastName: true, profilePicture: true } }, listing: { select: { title: true, seller: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } } }, messages: { select: { id: true, content: true, senderId: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { updatedAt: 'desc' } });
    }

    async find(user: User, conversationId: string) {
        const conversation = await this.prismaService.conversation.findUnique({
            where: { id: conversationId },
            include: {
                listing: true,
            },
        });

        if (!conversation) throw new NotFoundException('Conversation not found');

        const isBuyer = conversation.buyerId === user.id;
        const isSeller = conversation.listing.sellerId === user.id;
        
        if(!isBuyer && !isSeller) throw new ForbiddenException('You are not a member of this conversation');
        
        return await this.prismaService.message.findMany({ where: { conversationId }, include: { sender: { select: { id: true, profilePicture: true } } }, orderBy: { createdAt: 'asc' } });
    }
}
