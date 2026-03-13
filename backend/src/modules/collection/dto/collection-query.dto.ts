import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Rarity } from '../../../generated/prisma/enums';

export enum SortOption {
  NEWEST = 'NEWEST',
  RARITY = 'RARITY',
  ALPHABETICAL = 'ALPHABETICAL',
}

/**
 * Data Transfer Object for collection querying.
 */
export class CollectionQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by card title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: Rarity, description: 'Filter by card rarity' })
  @IsOptional()
  @IsEnum(Rarity)
  rarity?: Rarity;

  @ApiPropertyOptional({ enum: SortOption, description: 'Sort criteria', default: SortOption.NEWEST })
  @IsOptional()
  @IsEnum(SortOption)
  sortBy?: SortOption = SortOption.NEWEST;
}
