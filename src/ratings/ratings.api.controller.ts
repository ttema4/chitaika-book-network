import { 
    Controller, Get, Post, Body, Param, Delete, 
    ValidationPipe, NotFoundException, BadRequestException, 
    ParseIntPipe, Res, Query, DefaultValuePipe, UseInterceptors, UseGuards, Req, ForbiddenException 
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingResponseDto } from './dto/rating-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('ratings')
@Controller('api/ratings')
export class RatingsApiController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create or update a rating' })
  @ApiResponse({ status: 201, description: 'Rating created/updated.', type: RatingResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateRatingDto })
  async create(@Body(new ValidationPipe()) createRatingDto: CreateRatingDto, @Req() req: any) {
    const userId = req.user.id;
    return this.ratingsService.setRating(
        userId, 
        createRatingDto.book_id, 
        createRatingDto.rating, 
        createRatingDto.review
    );
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @ApiOperation({ summary: 'Get all ratings with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starting from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all ratings.', 
    type: [RatingResponseDto],
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
    const [ratings, total] = await this.ratingsService.findAllWithPagination(skip, limit);
    
    const links: string[] = [];
    const baseUrl = '/api/ratings';

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
    
    return ratings;
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @ApiOperation({ summary: 'Get a rating by id' })
  @ApiResponse({ status: 200, description: 'Return the rating.', type: RatingResponseDto })
  @ApiResponse({ status: 404, description: 'Rating not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const rating = await this.ratingsService.findOne(id);
    if (!rating) {
        throw new NotFoundException(`Rating with ID ${id} not found`);
    }
    return rating;
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a rating' })
  @ApiResponse({ status: 200, description: 'The rating has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Rating not found.' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const rating = await this.ratingsService.findOne(id);
    if (!rating) {
        throw new NotFoundException(`Rating with ID ${id} not found`);
    }
    const user = req.user;
    if (rating.user.id !== user.id && user.role !== 'admin') {
        throw new ForbiddenException('You can only delete your own ratings');
    }
    return this.ratingsService.remove(id);
  }
}
