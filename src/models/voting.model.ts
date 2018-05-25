/**
 * @license MIT
 */

import {
    IsIn,
    IsInstance,
    IsOptional,
    IsString,
} from 'class-validator';

import {
    BaseModel,
    IdentityModel,
} from '../models';

export class VotingModel extends BaseModel {
    @IsIn([1, 0, -1])
    public value?: 1 | 0 | -1;

    @IsString()
    public reason?: string;

    @IsString()
    public link?: string;

    @IsInstance(IdentityModel)
    @IsOptional()
    public author?: IdentityModel;

    @IsString()
    public authorId!: string;

    public date!: Date;
}
