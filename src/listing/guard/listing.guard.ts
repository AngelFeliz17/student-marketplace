import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ListingOwnerGuard implements CanActivate {
    constructor(private prisma: PrismaService) {}

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const listingId = request.params.id;
        
        if (!user) {
            throw new UnauthorizedException();
        }

        const listing = await this.prisma.listing.findUnique({ where: { id: listingId }, select: { sellerId: true } });

        if(!listing) throw new NotFoundException("Listing not found")

        if (user.id !== listing.sellerId) throw new UnauthorizedException('Only the seller can perfom this action');

        return true;
    }
}