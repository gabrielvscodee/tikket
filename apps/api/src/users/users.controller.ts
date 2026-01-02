import { Body, Controller, Get, Post } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Body() body: { email: string; name?: string }) {
    return this.usersService.create(body)
  }

  @Get()
  findAll() {
    return this.usersService.findAll()
  }
}
