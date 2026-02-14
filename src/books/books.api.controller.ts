import { 
    Controller, Get, Post, Body, Patch, Param, Delete, 
    UsePipes, ValidationPipe, NotFoundException, 
    ParseIntPipe, Header, Headers, Res, UseInterceptors, Query, DefaultValuePipe 
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { CacheControl } from '../common/decorators/cache-control.decorator';

@ApiTags('books')
@Controller('api/books')
export class BooksApiController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({ status: 201, description: 'The book has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateBookDto })
  async create(@Body(new ValidationPipe()) createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @ApiOperation({ summary: 'Get all books with pagination' })
  @ApiHeader({ name: 'Link', description: 'Links to next/prev pages' })
  @ApiResponse({ status: 200, description: 'Return all books.' })
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
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
  @ApiResponse({ status: 200, description: 'Return the book.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const book = await this.booksService.findOne(id);
    if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a book' })
  @ApiResponse({ status: 200, description: 'The book has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body(new ValidationPipe()) updateBookDto: UpdateBookDto) {
    const book = await this.booksService.findOne(id);
    if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book' })
  @ApiResponse({ status: 200, description: 'The book has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const book = await this.booksService.findOne(id);
    if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return this.booksService.remove(id);
  }
}
