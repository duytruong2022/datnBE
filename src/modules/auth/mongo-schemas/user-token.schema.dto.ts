import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoCollection, UserTokenTypes } from 'src/common/constants';
import { Document } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { Types } from 'mongoose';
import { ObjectId } from 'mongodb';
export type UserTokenDocument = UserToken & Document;

@Schema({
    timestamps: true,
    collection: MongoCollection.USER_TOKENS,
})
export class UserToken extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        trim: true,
    })
    token: string;

    @Prop({
        required: true,
        type: String,
        trim: true,
    })
    hashToken: string;

    @Prop({
        required: true,
        type: String,
        enum: Object.values(UserTokenTypes),
        default: UserTokenTypes.REFRESH_TOKEN,
    })
    type: string;

    @Prop({ required: true, type: Types.ObjectId })
    userId: ObjectId;
}

export const UserTokenSchema = SchemaFactory.createForClass(UserToken);
