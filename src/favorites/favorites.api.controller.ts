import { 
    Controller, Get, Post, Body, Param, Delete, 
    ValidationPipe, BadRequestException,
    ParseIntPipe, Res, Query, DefaultValuePipe, UseInterceptors, UseGuards 
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoriteResponseDto } from './dto/favorite-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('favorites')
@Controller('api/favorites')
export class FavoritesApiController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Add a book to favorites' })
  @ApiResponse({ status: 201, description: 'Book added to favorites.', type: FavoriteResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Book already in favorites.' })
  @ApiBody({ type: CreateFavoriteDto })
  async create(@Body(new ValidationPipe()) createFavoriteDto: CreateFavoriteDto) {
    return this.favoritesService.add(createFavoriteDto.user_id, createFavoriteDto.book_id);
  }
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @Get()
  @ApiOperation({ summary: 'Get all favorites with pagination' })
  @ApiHeader({ name: 'Link', description: 'Links to next/prev pages' })
  @ApiResponse({ status: 200, description: 'Return all favorites.', type: [FavoriteResponseDto] })
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: any,
  ) {
    if (page < 1 || limit < 1 || page > Number.MAX_SAFE_INTEGER || limit > Number.MAX_SAFE_INTEGER) {
       throw new BadRequestException('Validation failed (page and limit must be positive integers)');
    }
    const skip = (page - 1) * limit;
    const [favorites, total] = await this.favoritesService.findAllWithPagination(skip, limit);
    
    const links: string[] = [];
    const baseUrl = '/api/favorites';

    if (page > 1) {
        links.push(`<${baseUrl}?page=${page - 1}&limit=${limit}>; rel="prev"`);
    }
    
    if (page * limit < total) {
        links.push(`<${baseUrl}?page=${page + 1}&limit=${limit}>; rel="next"`);
    }

    if (links.length > 0) {
        res.setHeader('Link', links.join(', '));
    }
    
    res.setHeader('X-Total-Count', total.toString());
    
    return favorites;
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Remove a book from favorites' })
  @ApiResponse({ status: 200, description: 'Book removed from favorites.' })
  @ApiResponse({ status: 404, description: 'Favorite not found.' })
  async remove(@Query('userId', ParseIntPipe) userId: number, @Query('bookId', ParseIntPipe) bookId: number) {
     return this.favoritesService.remove(userId, bookId);
  }
}
