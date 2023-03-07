import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
    DEFAULT_LANGUAGE,
    INPUT_TEXT_MAX_LENGTH,
    Languages,
    MongoCollection,
    TEXTAREA_MAX_LENGTH,
    Timezones,
    UserStatus,
} from 'src/common/constants';
import { Document, SchemaTypes } from 'mongoose';
import { BaseSchema } from 'src/common/mongo-schemas/base.shema';
import { IProjectUser, IUserAccessModule } from '../user.interface';
import { RegistrationFrom } from '../user.constant';
import { ObjectId } from 'mongodb';
import { SecurityPermissions } from 'src/modules/security-profile/security-profile.constant';
export type UserDocument = User & Document;
@Schema({
    timestamps: true,
    collection: MongoCollection.USERS,
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
})
export class User extends BaseSchema {
    @Prop({
        required: true,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    email: string;

    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    ldapUsername: string;

    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    password: string;

    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    firstName: string;

    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    lastName: string;

    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    phoneNumber: string;

    @Prop({ required: false, type: Array(SchemaTypes.ObjectId), default: [] })
    constellationGroupIds: ObjectId[];

    @Prop({ required: false, type: Array(SchemaTypes.ObjectId), default: [] })
    viewer3dGroupIds: ObjectId[];

    @Prop({
        required: false,
        type: JSON,
    })
    accessModules?: IUserAccessModule[];

    @Prop({
        require: false,
        type: String,
        enum: [...Object.values(Languages), ''],
        default: DEFAULT_LANGUAGE,
    })
    language: Languages;

    @Prop({
        require: false,
        type: String,
        enum: [...Object.values(Timezones), ''],
    })
    timezone: Timezones;

    @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Country' })
    countryId: ObjectId;

    @Prop({ required: false, type: Array(SchemaTypes.ObjectId), default: [] })
    securityProfileIds: ObjectId[];

    @Prop({ required: false, type: Array(SchemaTypes.ObjectId), default: [] })
    viewer3dProfileIds: ObjectId[];

    @Prop({
        required: false,
        type: String,
        maxLength: TEXTAREA_MAX_LENGTH,
        trim: true,
    })
    city: string;

    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    jobTitle: string;

    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    company: string;

    @Prop({
        required: false,
        type: String,
        maxLength: TEXTAREA_MAX_LENGTH,
        trim: true,
    })
    address: string;

    @Prop({ required: false, default: null, type: Date })
    lastLoginAt?: Date;

    @Prop({
        require: false,
        type: String,
        enum: Object.values(RegistrationFrom),
        default: RegistrationFrom.ADMIN_CREATE,
    })
    registrationFrom: RegistrationFrom;

    @Prop({ type: Boolean })
    needToChangePassword?: boolean;

    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    newPasswordWaitingActice: string;

    @Prop({
        required: false,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    ldapDn: string;

    @Prop({ required: false, default: null, type: Date })
    approvedAt?: Date;

    @Prop({ required: false, default: null, type: SchemaTypes.ObjectId })
    approvedBy?: ObjectId;

    @Prop({
        require: false,
        type: String,
        enum: Object.values(UserStatus),
    })
    status: UserStatus;

    @Prop({ required: false, type: Array(SchemaTypes.ObjectId), default: [] })
    assignedProjectIds?: ObjectId[];

    @Prop({
        required: false,
        type: JSON,
    })
    projects: IProjectUser[];

    @Prop({ required: false, type: Array(SchemaTypes.ObjectId), default: [] })
    adminProjectIds?: ObjectId[];

    permissions: SecurityPermissions[];
}
const BaseUserSchema = SchemaFactory.createForClass(User);

BaseUserSchema.pre<User>('save', function (next) {
    if (this.email) {
        this.email = this.email.toLowerCase();
    }
    next();
});
BaseUserSchema.pre<User>('updateOne', function (next) {
    if (this.email) {
        this.email = this.email.toLowerCase();
    }
    next();
});

BaseUserSchema.virtual('country', {
    ref: 'Country',
    localField: 'countryId',
    foreignField: '_id',
    justOne: true,
});

export const UserSchema = BaseUserSchema;
