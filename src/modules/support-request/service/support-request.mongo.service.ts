import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import {
    AccessModules,
    DEFAULT_LIMIT_FOR_PAGINATION,
    INTEGER_POSITIVE_MIN_VALUE,
    OrderBy,
    OrderDirection,
    softDeleteCondition,
} from 'src/common/constants';
import {
    appendCSVFile,
    createCSVFile,
    getMongoKeywordConditions,
    hasSecurityPermissions,
    toBase64,
} from 'src/common/helpers/commonFunctions';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { MODULE_NAME } from 'src/modules/group/group.constant';
import {
    SupportRequest,
    SupportRequestDocument,
} from '../mongo-schemas/support-request.schema';
import {
    ICreateSupportRequest,
    ISupportRequestExportListQuery,
    ISupportRequestListQuery,
    IUpdateSupportRequest,
} from '../support-request.interface';
import { I18nRequestScopeService } from 'nestjs-i18n';
import {
    exportColumns,
    EXPORT_CSV_FILE_NAME,
    i18ExportKey,
    i18KeyExportColumns,
} from '../support-request.constant';
import { DownloadCSVGateway } from './download-csv.socket.gateway';
import ConfigKey from 'src/common/config/config-key';
import { SendGridService } from 'src/common/services/sendgrid.service';
import { UserMongoService } from 'src/modules/user/services/user.mongo.service';
import { SecurityPermissions } from 'src/modules/security-profile/security-profile.constant';
import { User } from 'src/modules/user/mongo-schemas/user.schema';

const DEFAULT_LIMIT_FOR_EXPORT = 100;
const supportRequestAttributes = [
    'email',
    'firstName',
    'lastName',
    'category',
    'priority',
    'version',
    'site',
    'object',
    'reference',
    'detail',
    'file',
    'createdBy',
];
@Injectable()
export class SupportRequestService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(SupportRequest.name)
        private readonly supportRequestModel: Model<SupportRequestDocument>,
        private readonly i18n: I18nRequestScopeService,
        private readonly downloadCSVGateway: DownloadCSVGateway,
        private readonly sendGridService: SendGridService,
        private readonly userService: UserMongoService,
    ) {}
    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async getSupportRequestById(id: ObjectId) {
        try {
            const supportRequest = await this.supportRequestModel
                .findOne({
                    _id: id,
                    ...softDeleteCondition,
                })
                .select(supportRequestAttributes)
                .lean();

            return {
                ...supportRequest,
                file: {
                    ...supportRequest.file,
                    path: supportRequest?.file?.originalname
                        ? `${process.env.FILE_STORAGE_BASE_URL}/${process.env.FILE_STORAGE_SUPPORT_REQUEST_PATH}/${supportRequest?.file?.filename}`
                        : null,
                },
            };
        } catch (error) {
            this.logger.error('Error in getSupportRequestById service', error);
            throw error;
        }
    }

    async createSupportRequest(supportRequest: ICreateSupportRequest) {
        try {
            const newSupportRequest = new this.supportRequestModel({
                ...supportRequest,
            });
            return await newSupportRequest.save();
        } catch (error) {
            this.logger.error('Error in createSupportRequest service', error);
            throw error;
        }
    }

    async updateSupportRequest(
        id: ObjectId,
        updateSupportRequest: IUpdateSupportRequest,
    ) {
        try {
            await this.supportRequestModel.updateOne(
                { _id: id, ...softDeleteCondition },
                updateSupportRequest,
            );
            const supportRequest = await this.getSupportRequestById(id);
            return supportRequest;
        } catch (error) {
            this.logger.error('Error in updateSupportRequest service', error);
            throw error;
        }
    }

    async deleteSupportRequest(
        id: ObjectId,
        deletedBy: ObjectId,
    ): Promise<void> {
        try {
            await this.supportRequestModel.updateOne(
                { _id: id, ...softDeleteCondition },
                {
                    deletedAt: new Date(),
                    deletedBy: new ObjectId(deletedBy),
                },
            );
        } catch (error) {
            this.logger.error('Error in deleteSupportRequest service', error);
            throw error;
        }
    }

    async getSupportRequestList(query: ISupportRequestListQuery) {
        try {
            const {
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                orderDirection = OrderDirection.DESCENDING,
                orderBy = OrderBy.CREATED_AT,
                categories = [],
                sites = [],
                priorities = [],
                accessModule,
                createdBy = null,
            } = query;
            const mongooseQuery = this.generateSupportRequestListQuery({
                keyword,
                categories,
                sites,
                priorities,
                accessModule,
                createdBy,
            });

            const [resultList, count] = await Promise.all([
                this.supportRequestModel
                    .find({
                        $and: mongooseQuery,
                    })
                    .sort({
                        [orderBy]:
                            orderDirection === OrderDirection.ASCENDING
                                ? -1
                                : 1,
                    })
                    .limit(limit)
                    .skip(limit * (page - 1))
                    .select(supportRequestAttributes)
                    .lean(),
                this.supportRequestModel.countDocuments({
                    $and: mongooseQuery,
                }),
            ]);
            return {
                items: resultList.map((supportRequest) => {
                    return {
                        ...supportRequest,
                        file: {
                            ...supportRequest.file,
                            path: supportRequest?.file?.originalname
                                ? `${process.env.FILE_STORAGE_BASE_URL}/${process.env.FILE_STORAGE_SUPPORT_REQUEST_PATH}/${supportRequest?.file?.filename}`
                                : null,
                        },
                    };
                }),
                totalItems: count,
            };
        } catch (error) {
            this.logger.error('Error in getSupportRequestList service', error);
            throw error;
        }
    }

    generateSupportRequestListQuery({
        keyword,
        categories,
        sites,
        priorities,
        accessModule,
        createdBy,
    }) {
        const conditions = [];
        conditions.push({ ...softDeleteCondition, accessModule });
        if (keyword) {
            conditions.push(
                getMongoKeywordConditions(
                    ['email', 'firstName', 'lastName'],
                    keyword,
                ),
            );
        }
        if (categories?.length) {
            conditions.push({
                category: {
                    $in: categories,
                },
            });
        }
        if (sites?.length) {
            conditions.push({
                site: {
                    $in: sites,
                },
            });
        }
        if (priorities?.length) {
            conditions.push({
                priority: {
                    $in: priorities,
                },
            });
        }

        if (createdBy) {
            conditions.push({
                createdBy: new ObjectId(createdBy),
            });
        }
        return conditions;
    }

    async exportSupportRequestList(query: ISupportRequestExportListQuery) {
        try {
            const {
                keyword = '',
                orderDirection = OrderDirection.DESCENDING,
                orderBy = OrderBy.CREATED_AT,
                categories = [],
                sites = [],
                priorities = [],
                accessModule,
                socketClientId = '',
                createdBy = null,
            } = query;
            const mongooseQuery = this.generateSupportRequestListQuery({
                keyword,
                categories,
                sites,
                priorities,
                accessModule,
                createdBy,
            });

            // create header file csv
            const filename = `${EXPORT_CSV_FILE_NAME}_${new Date().getTime()}.csv`;
            await createCSVFile(
                exportColumns,
                i18KeyExportColumns,
                this.configService.get(
                    ConfigKey.FILE_STORAGE_SUPPORT_REQUEST_CSV_FOLDER,
                ),
                filename,
                [],
                i18ExportKey,
                this.i18n,
            );
            const totalItems = await this.supportRequestModel.countDocuments({
                $and: mongooseQuery,
            });

            // get support request and append to file csv
            const totalPage = Math.ceil(totalItems / DEFAULT_LIMIT_FOR_EXPORT);
            let currentPage = 1;
            while (currentPage <= totalPage) {
                const supportRequests = await this.supportRequestModel
                    .find({
                        $and: mongooseQuery,
                    })
                    .sort({
                        [orderBy]:
                            orderDirection === OrderDirection.ASCENDING
                                ? -1
                                : 1,
                    })
                    .limit(DEFAULT_LIMIT_FOR_EXPORT)
                    .skip(DEFAULT_LIMIT_FOR_EXPORT * (currentPage - 1))
                    .select(supportRequestAttributes)
                    .lean();
                if (supportRequests.length > 0) {
                    await appendCSVFile(
                        exportColumns,
                        i18KeyExportColumns,
                        this.configService.get(
                            ConfigKey.FILE_STORAGE_SUPPORT_REQUEST_CSV_FOLDER,
                        ),
                        filename,
                        supportRequests as SupportRequest[],
                        i18ExportKey,
                        this.i18n,
                    );
                }
                currentPage++;
            }

            // send export csv data
            this.downloadCSVGateway.sendExportCSVData(
                {
                    fileName: `${EXPORT_CSV_FILE_NAME}.csv`,
                    filePath: `${this.configService.get(
                        ConfigKey.FILE_STORAGE_BASE_URL,
                    )}/${this.configService.get(
                        ConfigKey.FILE_STORAGE_SUPPORT_REQUEST_CSV_PATH,
                    )}/${filename}`,
                },
                socketClientId,
            );
        } catch (error) {
            this.logger.error('Error in getSupportRequestList service', error);
            throw error;
        }
    }

    async sendSupportRequestEmail(
        body: ICreateSupportRequest | IUpdateSupportRequest | SupportRequest,
    ) {
        const message = {
            to: this.configService.get(
                ConfigKey.SENDGRID_SUPPORT_REQUEST_ADMIN,
            ),
            from: this.configService.get(ConfigKey.SENDGRID_SENDER),
            templateId: this.configService.get(
                ConfigKey.SENDGRID_TEMPLATE_ID_SEND_SUPPORT_REQUEST,
            ),
            dynamicTemplateData: {
                subject: this.i18n.translate(
                    'support-request.sendEmail.subject',
                ),
                email: body.email,
                category: this.i18n.translate(
                    `support-request.exportData.fieldData.${body.category}`,
                ),
                priority: this.i18n.translate(
                    `support-request.exportData.fieldData.${body.priority}`,
                ),
                version: body.version,
                object: body.object,
                reference: body.reference,
                detail: body.detail,
            },
        };
        if (body.file) {
            Object.assign(message, {
                attachments: [
                    {
                        content: toBase64(body.file.path),
                        filename: body.file.originalname,
                        type: body.file.type,
                        disposition: 'attachment',
                    },
                ],
            });
        }

        return await this.sendGridService.sendMail(message);
    }

    checkViewAllPermission(user: User, accessModule: AccessModules): boolean {
        try {
            if (accessModule === AccessModules.SPACIALYTIC_PLATFORM) {
                return true;
            }

            return hasSecurityPermissions(user, [
                SecurityPermissions.HELP_VIEW_ALL,
            ]);
        } catch (error) {
            this.logger.error('Error in checkViewAllPermission service', error);
            throw error;
        }
    }
}
