import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { Connection, Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
    ProjectLog,
    ProjectLogDocument,
} from '../mongo-schemas/project-log.schema';
import {
    IProjectLogCreateBody,
    IProjectLogListQuery,
} from '../project-log.interface';
import {
    DEFAULT_LIMIT_FOR_PAGINATION,
    INTEGER_POSITIVE_MIN_VALUE,
    MongoCollection,
    OrderBy,
    OrderDirection,
    softDeleteCondition,
} from 'src/common/constants';
import {
    getTotalSkipItem,
    runBashScriptSync,
} from 'src/common/helpers/commonFunctions';
import { ObjectId } from 'mongodb';

@Injectable()
export class ProjectLogMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(ProjectLog.name)
        private readonly projectLogModel: Model<ProjectLogDocument>,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}
    private readonly logger = createWinstonLogger(
        'project-log',
        this.configService,
    );

    async getListProjectLog(query: IProjectLogListQuery) {
        try {
            const {
                page = INTEGER_POSITIVE_MIN_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                modules = [],
                orderDirection = OrderDirection.DESCENDING,
                orderBy = OrderBy.CREATED_AT,
                projectIds,
                actions = [],
                updatedAtRange = [],
            } = query;
            const [projectLogList, totalUsers] = await Promise.all([
                this.projectLogModel.aggregate([
                    {
                        $lookup: {
                            from: MongoCollection.USERS,
                            localField: 'createdBy',
                            foreignField: '_id',
                            as: 'taskOwner',
                        },
                    },
                    {
                        $lookup: {
                            from: MongoCollection.PROJECTS,
                            localField: 'projectId',
                            foreignField: '_id',
                            as: 'projects',
                        },
                    },
                    {
                        $sort: {
                            [orderBy]:
                                orderDirection === OrderDirection.DESCENDING
                                    ? -1
                                    : 1,
                        },
                    },
                    {
                        $match: {
                            $and: [
                                ...this.generateProjectLogListQueryBuilder({
                                    keyword,
                                    modules,
                                    projectIds,
                                    actions,
                                    updatedAtRange,
                                }),
                            ],
                        },
                    },
                    { $skip: getTotalSkipItem(page, limit) },
                    { $limit: +limit },
                ]),
                this.projectLogModel.aggregate([
                    {
                        $match: {
                            $and: [
                                ...this.generateProjectLogListQueryBuilder({
                                    keyword,
                                    modules,
                                    projectIds,
                                    actions,
                                    updatedAtRange,
                                }),
                            ],
                        },
                    },
                    { $group: { _id: null, totalUsers: { $sum: 1 } } },
                ]),
            ]);
            return {
                items: projectLogList.map((projectLog) => {
                    return {
                        ...projectLog,
                        taskOwner: projectLog.taskOwner[0],
                        project: projectLog.projects[0],
                    };
                }),
                totalItems: totalUsers[0]?.totalUsers | 0,
            };
        } catch (error) {
            this.logger.error('Error in getListProjectLog service', error);
            throw error;
        }
    }

    async createProjectLog(projectLog: IProjectLogCreateBody) {
        try {
            const record = new this.projectLogModel({
                ...projectLog,
                createdAt: new Date(),
            });
            await record.save();
        } catch (error) {
            this.logger.error('Error in createProjectLog service', error);
            throw error;
        }
    }

    generateProjectLogListQueryBuilder({
        keyword,
        modules,
        projectIds,
        actions,
        updatedAtRange,
    }) {
        const conditions = [];
        conditions.push({ ...softDeleteCondition });
        if (keyword) {
            conditions.push({
                $or: [
                    {
                        'oldData.name': {
                            $regex: `.*${keyword}.*`,
                            $options: 'i',
                        },
                    },
                    {
                        'newData.name': {
                            $regex: `.*${keyword}.*`,
                            $options: 'i',
                        },
                    },
                    {
                        'newData.email': {
                            $regex: `.*${keyword}.*`,
                            $options: 'i',
                        },
                    },
                ],
            });
        }

        if (modules) {
            conditions.push({
                module: {
                    $in: modules,
                },
            });
        }

        if (projectIds?.length) {
            conditions.push({
                projectId: {
                    $in: projectIds.map((projectId) => new ObjectId(projectId)),
                },
            });
        }

        if (actions?.length) {
            conditions.push({
                action: {
                    $in: actions,
                },
            });
        }

        if (updatedAtRange?.length) {
            conditions.push({
                createdAt: {
                    $gte: new Date(updatedAtRange[0]),
                },
            });
            conditions.push({
                createdAt: {
                    $lte: new Date(updatedAtRange[1]),
                },
            });
        }

        return conditions;
    }

    async downloadInstanceLog(date: string) {
        const command = `yarn download-instance-log "${process.env.SSH_PORT}" "${process.env.SSH_PRIVATE_KEY_PATH}" "${process.env.SSH_USERNAME}" "${process.env.SSH_HOST}" "${date}" "${process.env.SFTP_PASSWORD}" "${process.env.SFTP_USERNAME}" "${process.env.SFTP_HOST}" "${process.env.SFTP_INSTANCE_LOG_FOLDER_PATH}/${date}" "${process.env.WEBVIEWER3D_SCRIPT_REPOSITORY}"`;
        this.logger.info(`Command to download instance log: ${command}`);
        await runBashScriptSync(command);
    }

    async downloadServerLog(date: string) {
        const command = `yarn download-server-log "${process.env.SSH_PORT}" "${process.env.SSH_PRIVATE_KEY_PATH}" "${process.env.SSH_USERNAME}" "${process.env.SSH_HOST}" "${date}" "${process.env.SFTP_PASSWORD}" "${process.env.SFTP_USERNAME}" "${process.env.SFTP_HOST}" "${process.env.SFTP_SERVER_LOG_FOLDER_PATH}/${date}" "${process.env.WEBVIEWER3D_SCRIPT_REPOSITORY}"`;
        this.logger.info(`Command to download server log: ${command}`);
        await runBashScriptSync(command);
    }

    async downloadLicenseLog(date: string) {
        const command = `yarn download-license-log "${process.env.SSH_PORT}" "${
            process.env.SSH_PRIVATE_KEY_PATH
        }" "${process.env.SSH_USERNAME}" "${process.env.SSH_HOST}" "${
            process.env.SFTP_PASSWORD
        }" "${process.env.SFTP_USERNAME}" "${process.env.SFTP_HOST}" "${
            process.env.SFTP_LICENSE_LOG_FOLDER_PATH
        }" "${
            process.env.WEBVIEWER3D_PASSPHRASE
        }" "${`${process.env.BACKEND_API_URL}/project-log/${date}/license-log`} ${
            process.env.WEBVIEWER3D_SCRIPT_REPOSITORY
        }"`;
        this.logger.info(`Command to download license log: ${command}`);
        await runBashScriptSync(command);
    }
}
