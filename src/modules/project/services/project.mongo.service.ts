import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import { ObjectId } from 'mongodb';
import { Connection, Expression, Model } from 'mongoose';
import {
    DEFAULT_FIRST_PAGE,
    DEFAULT_ORDER_DIRECTION,
    OrderDirection,
    softDeleteCondition,
} from 'src/common/constants';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { User, UserDocument } from 'src/modules/user/mongo-schemas/user.schema';
import {
    BaselineConfiguration,
    BaselineConfigurationDocument,
} from '../mongo-schemas/baseline-configuration.schema';
import {
    PlanningDocument,
    ProjectPlanning,
} from '../mongo-schemas/planning.schema';
import { Project, ProjectDocument } from '../mongo-schemas/project.schema';
import { ProjectTask, TaskDocument } from '../mongo-schemas/task.schema';
import {
    DEFAULT_PROJECT_PAGE_LIMIT,
    MILLISECOND_PER_DAY,
    MODULE_NAME,
    projectAttributes,
    ProjectOrderBy,
} from '../project.constant';
import {
    ICreateProject,
    IGetProjectQueryString,
    IProject,
    IUpdateProjectActivityCodeStatus,
} from '../project.interface';

@Injectable()
export class ProjectMongoService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Project.name)
        private readonly projectModel: Model<ProjectDocument>,
        @InjectModel(ProjectPlanning.name)
        private readonly planningModel: Model<PlanningDocument>,
        @InjectModel(ProjectTask.name)
        private readonly taskModel: Model<TaskDocument>,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectModel(BaselineConfiguration.name)
        private readonly baselineConfigurationModel: Model<BaselineConfigurationDocument>,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    generateQuery({
        keyword,
        category,
        createdAt,
        createdBy,
        accessibleProjectIds,
    }) {
        const query = [];

        if (keyword.length) {
            query.push({
                $or: [
                    {
                        name: {
                            $regex: keyword,
                            $options: 'i',
                        },
                    },
                    {
                        description: {
                            $regex: keyword,
                            $options: 'i',
                        },
                    },
                ],
            });
        }
        if (accessibleProjectIds?.length) {
            query.push({
                _id: {
                    $in: accessibleProjectIds,
                },
            });
        }

        if (category.length) {
            query.push({ category });
        }

        if (createdBy.length) {
            query.push({ createdBy: new ObjectId(createdBy) });
        }

        if (createdAt.length) {
            query.push({
                $and: [
                    {
                        createdAt: {
                            $gte: moment(createdAt[0]).toDate(),
                        },
                    },
                    {
                        createdAt: {
                            $lte: moment(createdAt[1]).toDate(),
                        },
                    },
                ],
            });
        }

        return {
            $and: [...query, softDeleteCondition],
        };
    }

    calculateNewFinish(newStart: Date, start: Date, finish: Date): Date {
        const duration = Math.ceil(
            Math.abs(
                (finish.getTime() - start.getTime()) / MILLISECOND_PER_DAY,
            ),
        );
        return moment(newStart).add(duration, 'days').toDate();
    }

    async getProjectById(
        id: string | ObjectId,
        attrs = [...projectAttributes],
    ) {
        try {
            const project = await this.projectModel
                .findOne({
                    _id: id,
                    ...softDeleteCondition,
                })
                .select([...attrs, 'createdBy'])
                .populate('manager', ['firstName', 'lastName'])
                .populate('admin', ['firstName', 'lastName'])
                .lean();
            return project;
        } catch (error) {
            throw error;
        }
    }

    async getProjectByName(name: string) {
        try {
            const project = await this.projectModel
                .findOne({
                    name,
                    ...softDeleteCondition,
                })
                .populate('admin')
                .populate('manager');
            return project;
        } catch (error) {
            throw error;
        }
    }

    async getListProject(query: IGetProjectQueryString) {
        const {
            page = DEFAULT_FIRST_PAGE,
            limit = DEFAULT_PROJECT_PAGE_LIMIT,
            keyword = '',
            category = '',
            createdBy = '',
            createdAt = '',
            orderBy = ProjectOrderBy.CREATED_AT,
            orderDirection = DEFAULT_ORDER_DIRECTION,
            accessibleProjectIds = [],
        } = query;
        try {
            const skip = (page - 1) * limit;
            const query = this.generateQuery({
                keyword,
                category,
                createdAt,
                createdBy,
                accessibleProjectIds,
            });

            const [items, totalItems] = await Promise.all([
                this.projectModel.aggregate([
                    {
                        $match: {
                            ...query,
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'createdBy',
                            foreignField: '_id',
                            pipeline: [
                                {
                                    $match: {
                                        ...softDeleteCondition,
                                    } as Expression,
                                },
                            ],
                            as: 'manager',
                        },
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'adminId',
                            foreignField: '_id',
                            pipeline: [
                                {
                                    $match: {
                                        ...softDeleteCondition,
                                    } as Expression,
                                },
                            ],
                            as: 'admin',
                        },
                    },
                    {
                        $unwind: '$manager',
                    },
                    {
                        $project: {
                            'manager.firstName': 1,
                            'manager.lastName': 1,
                            'admin.firstName': 1,
                            'admin.lastName': 1,
                            name: 1,
                            dataDate: 1,
                            category: 1,
                            description: 1,
                            postalCode: 1,
                            longitude: 1,
                            latitude: 1,
                            coordinatesDetails: 1,
                            adminId: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            taskIdSuffix: 1,
                            taskIdPrefix: 1,
                            taskIdIncrement: 1,
                        },
                    },
                    {
                        $sort: {
                            [orderBy]:
                                orderDirection === OrderDirection.ASCENDING
                                    ? 1
                                    : -1,
                        },
                    },
                    {
                        $skip: skip,
                    },
                    {
                        $limit: +limit,
                    },
                ]),
                this.projectModel.countDocuments(query),
            ]);
            return {
                items: items.map((project) => ({
                    ...project,
                    admin: project?.admin?.[0],
                })),
                totalItems,
            };
        } catch (error) {
            throw error;
        }
    }

    async isProjectNameDuplicate(
        name: string,
        id: ObjectId | null = null,
    ): Promise<boolean> {
        try {
            const query = {
                name: {
                    $regex: `^${name}$`,
                    $options: 'i',
                },
                ...softDeleteCondition,
            };
            if (id) {
                query['_id'] = {
                    $ne: id,
                };
            }
            const project = await this.projectModel.findOne(query);
            return !!project;
        } catch (error) {
            throw error;
        }
    }

    async createProject(projectData: ICreateProject) {
        try {
            const project = new this.projectModel({
                ...projectData,
            });
            const savedProject = await project.save();

            return await this.getProjectById(savedProject._id);
        } catch (error) {
            throw error;
        }
    }

    async updateProject(id: ObjectId, projectData: IProject) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();

            await this.projectModel.updateOne(
                {
                    _id: id,
                    ...softDeleteCondition,
                },
                {
                    ...projectData,
                },
                {
                    session,
                },
            );
            await this.planningModel.updateOne(
                {
                    projectId: id,
                    isTemplate: true,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        taskIdPrefix: projectData.taskIdPrefix,
                        taskIdSuffix: projectData.taskIdSuffix,
                        taskIdIncrement: projectData.taskIdIncrement,
                    },
                },
            );

            await session.commitTransaction();
            return await this.getProjectById(id);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async deleteProject(projectId: ObjectId, userId: string) {
        try {
            await this.projectModel.updateOne(
                {
                    _id: projectId,
                    ...softDeleteCondition,
                },
                {
                    deletedAt: new Date(),
                    deletedBy: userId,
                },
            );
        } catch (error) {
            throw error;
        }
    }

    async getProjectAdmin(adminId: ObjectId) {
        try {
            const admin = await this.userModel
                .findOne({
                    ...softDeleteCondition,
                    _id: adminId,
                })
                .lean();

            return admin;
        } catch (error) {
            this.logger.error('Error in getProjectAdmin service', error);
            throw error;
        }
    }

    async unassignProjectAdmin(adminId: ObjectId) {
        try {
            const admin = await this.projectModel
                .updateMany(
                    {
                        ...softDeleteCondition,
                        adminId,
                    },
                    {
                        adminId: null,
                    },
                )
                .lean();

            return admin;
        } catch (error) {
            this.logger.error('Error in unassignProjectAdmin service', error);
            throw error;
        }
    }

    async updateActivityCodeStatus(
        id: ObjectId,
        body: IUpdateProjectActivityCodeStatus,
    ) {
        try {
            await this.projectModel.updateOne(
                {
                    _id: id,
                    ...softDeleteCondition,
                },
                {
                    $set: {
                        displayActivityCode: body.status,
                        updatedBy: body.updatedBy,
                    },
                },
            );
            return await this.getProjectById(id);
        } catch (error) {
            throw error;
        }
    }
}
