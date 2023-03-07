import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { INPUT_TEXT_MAX_LENGTH, MongoCollection } from 'src/common/constants';
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
export type UserRegisterHistoryDocument = UserRegisterHistory & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.USER_REGISTER_HISTORIES,
})
export class UserRegisterHistory extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
        unique: true,
    })
    email: string;

    @Prop({ required: true, type: Date })
    lastRegisterAt?: Date;

    @Prop({ required: true, type: Number, default: 1 })
    registerCount?: number;

    @Prop({
        required: false,
        default: null,
        type: SchemaTypes.ObjectId,
    })
    createdBy: ObjectId;
}

export const UserRegisterHistorySchema =
    SchemaFactory.createForClass(UserRegisterHistory);
