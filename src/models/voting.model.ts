/**
 * @license MIT
 */

import {
    BaseModel,
    IdentityModel,
} from '../models';
import {
    IsString,
    IsInstance,
    IsOptional,
    IsIn,
} from 'class-validator';

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
