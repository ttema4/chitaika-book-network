import { 
    Controller, Get, Post, Body, Patch, Param, Delete, 
    ValidationPipe, NotFoundException, BadRequestException, 
    ParseIntPipe, Res, Query, DefaultValuePipe, UseInterceptors, UseGuards, Req, ForbiddenException 
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import type { Response, Request } from 'express';
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
  async create(@Body(new ValidationPipe()) createCommentDto: CreateCommentDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.commentsService.create({ ...createCommentDto, user_id: userId });
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @ApiOperation({ summary: 'Get all comments with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starting from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all comments.', 
    type: [CommentResponseDto],
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
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'The comment has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const comment = await this.commentsService.findOne(id);
    if (!comment) {
        throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    const user = (req as any).user;
    if (comment.user.id !== user.id && user.role !== 'admin') {
        throw new ForbiddenException('You can only delete your own comments');
    }
    return this.commentsService.remove(id);
  }
}
