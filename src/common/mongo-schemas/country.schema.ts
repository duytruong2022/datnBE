import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { INPUT_TEXT_MAX_LENGTH, MongoCollection } from '../constants';
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { BaseSchema } from './base.shema';
export type CountryDocument = Country & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.COUNTRIES,
})
export class Country extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
        unique: true,
    })
    name: string;

    @Prop({
        required: true,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
        unique: true,
    })
    code: string;

    @Prop({
        required: false,
        default: null,
        type: SchemaTypes.ObjectId,
    })
    createdBy: ObjectId;
}

export const CountrySchema = SchemaFactory.createForClass(Country);
