import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/users/decorators/roles.decorator';
import { RolesGuard } from 'src/users/guards/role.guard';
import { StatsService } from './stats.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('post/stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    @Get('posts-per-user')
    getPostsPerUser( @Query('from') from: string, @Query('to') to: string, @Query('limit') limit = '10') {
        return this.statsService.getPostsPerUser({
            from,
            to,
            limit: Number(limit) || 10,
        });
    }

    @Get('comments-over-time')
    getCommentsOverTime(@Query('from') from: string, @Query('to') to: string) {
        return this.statsService.getCommentsOverTime({
            from,
            to,
        });
    }

    @Get('comments-per-post')
    getCommentsPerPost(@Query('from') from: string, @Query('to') to: string, @Query('limit') limit = '10') {
        return this.statsService.getCommentsPerPost({
            from,
            to,
            limit: Number(limit) || 10,
        });
    }
}