import { 
    Controller, Get, Post, Body, Patch, Param, Delete, 
    ValidationPipe, NotFoundException, BadRequestException, 
    ParseIntPipe, Res, UseInterceptors, Query, UseGuards, Req, ForbiddenException 
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookResponseDto } from './dto/book-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('books')
@Controller('api/books')
export class BooksApiController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({ status: 201, description: 'The book has been successfully created.', type: BookResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateBookDto })
  async create(@Body(new ValidationPipe()) createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @ApiOperation({ summary: 'Get all books with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starting from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all books.', 
    type: [BookResponseDto],
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
    const [books, total] = await this.booksService.findAll(skip, limit);
    
    const links: string[] = [];
    const baseUrl = '/api/books';

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
    
    return books;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by id' })
  @ApiResponse({ status: 200, description: 'Return the book.', type: BookResponseDto })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const book = await this.booksService.findOne(id);
    if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a book' })
  @ApiResponse({ status: 200, description: 'The book has been successfully updated.', type: BookResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body(new ValidationPipe()) updateBookDto: UpdateBookDto, @Req() req: Request) {
    if ((req as any).user.role !== 'admin') {
        throw new ForbiddenException('Only admins can update books');
    }
    const book = await this.booksService.findOne(id);
    if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a book' })
  @ApiResponse({ status: 200, description: 'The book has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    if ((req as any).user.role !== 'admin') {
        throw new ForbiddenException('Only admins can delete books');
    }
    const book = await this.booksService.findOne(id);
    if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return this.booksService.remove(id);
  }
}
