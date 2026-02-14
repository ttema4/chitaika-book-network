import { 
    Controller, Get, Post, Body, Param, Delete, 
    ValidationPipe, NotFoundException, 
    ParseIntPipe, Res, Query, DefaultValuePipe, UseInterceptors, UseGuards 
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingResponseDto } from './dto/rating-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import type { Response } from 'express';
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
  async create(@Body(new ValidationPipe()) createRatingDto: CreateRatingDto) {
    return this.ratingsService.setRating(
        createRatingDto.user_id, 
        createRatingDto.book_id, 
        createRatingDto.rating, 
        createRatingDto.review
    );
  }
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @Get()
  @ApiOperation({ summary: 'Get all ratings with pagination' })
  @ApiHeader({ name: 'Link', description: 'Links to next/prev pages' })
  @ApiResponse({ status: 200, description: 'Return all ratings.', type: [RatingResponseDto] })
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
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
  @ApiOperation({ summary: 'Delete a rating' })
  @ApiResponse({ status: 200, description: 'The rating has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Rating not found.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.ratingsService.remove(id);
  }
}
