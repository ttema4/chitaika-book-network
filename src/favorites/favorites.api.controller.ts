import { 
    Controller, Get, Post, Body, Param, Delete, 
    ValidationPipe, BadRequestException, 
    ParseIntPipe, Res, Query, DefaultValuePipe, UseInterceptors, UseGuards, Req 
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoriteResponseDto } from './dto/favorite-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import type { Response, Request } from 'express';
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
  async create(@Body(new ValidationPipe()) createFavoriteDto: CreateFavoriteDto, @Req() req: any) {
    const userId = req.user.id;
    return this.favoritesService.add(userId, createFavoriteDto.book_id);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @ApiOperation({ summary: 'Get all favorites with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starting from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all favorites.', 
    type: [FavoriteResponseDto],
    headers: {
        'Link': { description: 'Pagination links for next/previous pages', schema: { type: 'string' } },
        'X-Total-Count': { description: 'Total number of items', schema: { type: 'integer' } }
    }
  })
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { page: pageRaw, limit: limitRaw } = req.query;

    if (Array.isArray(pageRaw) || Array.isArray(limitRaw)) {
        throw new BadRequestException('Validation failed (duplicate parameters)');
    }

    const isPristineInt = (val: any) => /^\d+$/.test(String(val));
    
    if ((pageRaw && !isPristineInt(pageRaw)) || (limitRaw && !isPristineInt(limitRaw))) {
        throw new BadRequestException('Validation failed (page and limit must be integers)');
    }

    const page = pageRaw ? parseInt(pageRaw as string, 10) : 1;
    const limit = limitRaw ? parseInt(limitRaw as string, 10) : 10;

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
  async remove(@Query('bookId', ParseIntPipe) bookId: number, @Req() req: any) {
     const userId = req.user.id;
     return this.favoritesService.remove(userId, bookId);
  }
}
