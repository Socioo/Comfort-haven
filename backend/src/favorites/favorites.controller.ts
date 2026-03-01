import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
// Assuming AuthGuard is available, otherwise I'll need to check where it is.
// I saw "guards" folder in auth.
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // I need to verify this path later

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all favorites for the current user' })
  findAll(@Request() req) {
    return this.favoritesService.findAll(req.user.id);
  }

  @Post(':propertyId')
  @ApiOperation({ summary: 'Add a property to favorites' })
  add(@Request() req, @Param('propertyId') propertyId: string) {
    return this.favoritesService.addLoop(req.user.id, propertyId);
  }

  @Delete(':propertyId')
  @ApiOperation({ summary: 'Remove a property from favorites' })
  remove(@Request() req, @Param('propertyId') propertyId: string) {
    return this.favoritesService.remove(req.user.id, propertyId);
  }

  @Get(':propertyId/check')
  @ApiOperation({ summary: 'Check if a property is in favorites' })
  check(@Request() req, @Param('propertyId') propertyId: string) {
    return this.favoritesService.check(req.user.id, propertyId);
  }
}
