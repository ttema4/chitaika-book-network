import { 
    Controller, Get, Post, Body, Patch, Param, Delete, 
    ValidationPipe, NotFoundException, BadRequestException, 
    ParseIntPipe, Res, Query, DefaultValuePipe, UseInterceptors, UseGuards 
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('users')
@Controller('api/users')
export class UsersApiController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateUserDto })
  async create(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiHeader({ name: 'Link', description: 'Links to next/prev pages' })
  @ApiResponse({ status: 200, description: 'Return all users.', type: [UserResponseDto] })
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: any,
  ) {
    if (page < 1 || limit < 1 || page > Number.MAX_SAFE_INTEGER || limit > Number.MAX_SAFE_INTEGER) {
       throw new BadRequestException('Validation failed (page and limit must be positive integers)');
    }
    const skip = (page - 1) * limit;
    const [users, total] = await this.usersService.findAllWithPagination(skip, limit);
    
    const links: string[] = [];
    const baseUrl = '/api/users';

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
    
    return users;
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'Return the user.', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'The user has been successfully updated.', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body(new ValidationPipe()) updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'The user has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Get(':id/friends')
  @ApiOperation({ summary: 'Get user friends' })
  @ApiResponse({ status: 200, description: 'Return user friends.', type: [UserResponseDto] })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getFriends(@Param('id', ParseIntPipe) id: number) {
      try {
          return await this.usersService.getFriends(id);
      } catch (e) {
          throw new NotFoundException(`User with ID ${id} not found`);
      }
  }
}
