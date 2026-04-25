import { 
    Controller, Get, Post, Body, Param, Delete, 
    ValidationPipe, BadRequestException, 
    ParseIntPipe, Res, Query, DefaultValuePipe, UseInterceptors, UseGuards, Req 
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { UserBooksService } from './user-books.service';
import { CreateUserBookDto } from './dto/create-user-book.dto';
import { UserBookResponseDto } from './dto/user-book-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('user-books')
@Controller('api/user-books')
export class UserBooksApiController {
  constructor(private readonly userBooksService: UserBooksService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update or create user book status' })
  @ApiResponse({ status: 201, description: 'User book status updated.', type: UserBookResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateUserBookDto })
  async create(@Body(new ValidationPipe()) createUserBookDto: CreateUserBookDto, @Req() req: any) {
    const userId = req.user.id;
    return this.userBooksService.updateStatus(
        userId,
        createUserBookDto.bookId,
        createUserBookDto.status
    );
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheControl('private, max-age=0, no-cache')
  @ApiOperation({ summary: 'Get all user books with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starting from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all user books.', 
    type: [UserBookResponseDto],
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
    const [userBooks, total] = await this.userBooksService.findAllWithPagination(skip, limit);
    
    const links: string[] = [];
    const baseUrl = '/api/user-books';

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
    
    return userBooks;
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Remove a book from user collection' })
  @ApiResponse({ status: 200, description: 'Book removed from collection.' })
  @ApiResponse({ status: 404, description: 'Entry not found.' })
  async remove(@Query('bookId', ParseIntPipe) bookId: number, @Req() req: any) {
      const userId = req.user.id;
      return this.userBooksService.removeByUserAndBook(userId, bookId);
  }
}
