import { 
    Controller, Get, Post, Body, Patch, Param, Delete, 
    ValidationPipe, NotFoundException, 
    ParseIntPipe, Res, Query, DefaultValuePipe, UseInterceptors, UseGuards 
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('comments')
@Controller('api/comments')
export class CommentsApiController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'The comment has been successfully created.', type: CommentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateCommentDto })
  async create(@Body(new ValidationPipe()) createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @Get()
  @ApiOperation({ summary: 'Get all comments with pagination' })
  @ApiHeader({ name: 'Link', description: 'Links to next/prev pages' })
  @ApiResponse({ status: 200, description: 'Return all comments.', type: [CommentResponseDto] })
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const skip = (page - 1) * limit;
    const [comments, total] = await this.commentsService.findAllWithPagination(skip, limit);
    
    const links: string[] = [];
    const baseUrl = '/api/comments';

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
    
    return comments;
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @ApiOperation({ summary: 'Get a comment by id' })
  @ApiResponse({ status: 200, description: 'Return the comment.', type: CommentResponseDto })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const comment = await this.commentsService.findOne(id);
    if (!comment) {
        throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'The comment has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(id);
  }
}
