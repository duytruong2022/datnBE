import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { HttpStatus } from 'src/common/constants';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipe/joi.validation.pipe';
import { ParseObjectIdPipe } from 'src/common/pipe/objectId.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipe/removeEmptyQuery.pipe';
import {
    CalendarListQuery,
    IConfigDateBody,
    IConfigDateData,
    ICreateCalendar,
    IGetCalendarConfigStringQuery,
    IUpdateCalendar,
} from '../project.interface';
import {
    CalendarQueryStringSchema,
    ConfigDateSchema,
    CreateCalendarSchema,
    GetCalendarConfigSchema,
    UpdateCalendarSchema,
} from '../project.validator';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { ObjectId } from 'mongodb';
import { ProjectMongoService } from '../services/project.mongo.service';
import { TrimBodyPipe } from 'src/common/pipe/trim.body.pipe';
import { CalendarConfigMongoService } from '../services/calendar-config.mongo.service';
import { CalendarMongoService } from '../services/calendar.mongo.service';
import {
    CalendarConfigRepeatTypes,
    DayTypes,
    MaximumRepeatYears,
    NumberOfDaysPerWeek,
} from '../project.constant';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';
import {
    AuthorizationGuard,
    Permissions,
} from 'src/common/guards/authorization.guard';
import { ProjectPermissions } from 'src/modules/project-profile/project-profile.constant';

@Controller('/calendar')
@UseGuards(AuthenticationGuard)
export class CalendarController {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly projectService: ProjectMongoService,
        private readonly calendarService: CalendarMongoService,
        private readonly calendarConfigService: CalendarConfigMongoService,
    ) {
        //
    }

    @Get('/')
    async getCalendarList(
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(CalendarQueryStringSchema),
        )
        query: CalendarListQuery,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                query.projectId,
                ['_id', 'name'],
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'calendar.error.project.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const { items, totalItems } =
                await this.calendarService.getCalendarList(query);
            return new SuccessResponse({ items, totalItems });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':calendarId')
    async getCalendarDetail(
        @Req() req,
        @Param('calendarId', ParseObjectIdPipe) calendarId: ObjectId,
    ) {
        try {
            const calendar = await this.calendarService.getCalendarById(
                calendarId,
            );
            if (!calendar) {
                const message = await this.i18n.translate(
                    'calendar.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(calendar);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('')
    @UseGuards(AuthorizationGuard)
    @Permissions([ProjectPermissions.GENERAL_CREATE_CALENDAR])
    async createCalendar(
        @Req() req,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(CreateCalendarSchema))
        body: ICreateCalendar,
    ) {
        try {
            const project = await this.projectService.getProjectById(
                body.projectId || '',
            );
            if (!project) {
                const message = await this.i18n.translate(
                    'calendar.error.project.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const calendarWithTheSameName =
                await this.calendarService.getProjectCalendarByName(
                    project._id,
                    body.name,
                );
            if (calendarWithTheSameName) {
                const message = await this.i18n.translate(
                    'calendar.error.duplicatedName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }
            const createdCalendar = await this.calendarService.createCalendar({
                ...body,
                projectId: new ObjectId(body.projectId),
                createdBy: new ObjectId(req.loginUser?._id),
            });
            return new SuccessResponse(createdCalendar);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':calendarId')
    async updateCalendar(
        @Req() req,
        @Param('calendarId', ParseObjectIdPipe) calendarId: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(UpdateCalendarSchema))
        body: IUpdateCalendar,
    ) {
        try {
            const calendar = await this.calendarService.getCalendarById(
                calendarId,
            );
            if (!calendar) {
                const message = await this.i18n.translate(
                    'calendar.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const calendarWithTheSameName =
                await this.calendarService.getProjectCalendarByName(
                    calendar.projectId,
                    body.name,
                    calendar._id,
                );
            if (calendarWithTheSameName) {
                const message = await this.i18n.translate(
                    'calendar.error.duplicatedName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        message,
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                    },
                ]);
            }
            const updatedCalendar = await this.calendarService.updateCalendar(
                calendarId,
                {
                    ...body,
                    updatedBy: new ObjectId(req.loginUser?._id),
                },
            );
            return new SuccessResponse(updatedCalendar);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(':calendarId')
    async deleteDayType(
        @Req() req,
        @Param('calendarId', ParseObjectIdPipe) calendarId: ObjectId,
    ) {
        try {
            const dayType = await this.calendarService.getCalendarById(
                calendarId,
            );
            if (!dayType) {
                const message = await this.i18n.translate(
                    'calendar.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            await this.calendarService.deleteCalendar(
                calendarId,
                new ObjectId(req.loginUser?._id),
            );
            return new SuccessResponse({ _id: calendarId });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post(':calendarId/config')
    async configCalendar(
        @Req() req,
        @Param('calendarId', ParseObjectIdPipe) calendarId: ObjectId,
        @Body(new TrimBodyPipe(), new JoiValidationPipe(ConfigDateSchema))
        body: IConfigDateBody,
    ) {
        try {
            const calendar = await this.calendarService.getCalendarById(
                calendarId,
            );
            if (!calendar) {
                const message = await this.i18n.translate(
                    'calendar.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const datesToBeUpdated = [];
            let startDateLoop = moment.tz(body.timezone);
            let endDateLoop = moment.tz(body.timezone);
            if (body.repeatType === CalendarConfigRepeatTypes.ONLY_THIS_DATE) {
                startDateLoop = moment.tz(body.date, body.timezone);
                endDateLoop = moment
                    .tz(body.date, body.timezone)
                    .add(1, 'week');
            } else {
                let day;
                if (
                    body.repeatType ===
                    CalendarConfigRepeatTypes.ALL_SAME_WEEK_DAY_THIS_MONTH
                ) {
                    day = +moment
                        .tz(body.date, body.timezone)
                        .fmDayOnlyString();
                    endDateLoop = moment
                        .tz(body.date, body.timezone)
                        .endOf('month')
                        .add(1, 'day');
                } else {
                    day = +moment.tz(body.date, body.timezone).dayOfYear();
                    endDateLoop = moment()
                        .tz(body.timezone)
                        .add(
                            body.repeatType ===
                                CalendarConfigRepeatTypes.ALL_SAME_WEEK_DAY_THIS_YEAR
                                ? 0
                                : MaximumRepeatYears,
                            'year',
                        )
                        .endOf('year')
                        .add(1, 'day');
                }
                startDateLoop = moment
                    .tz(body.date, body.timezone)
                    .subtract(
                        Math.floor(day / NumberOfDaysPerWeek) *
                            NumberOfDaysPerWeek,
                        'day',
                    );
            }
            const repeatCount =
                endDateLoop.diff(startDateLoop, 'day') / NumberOfDaysPerWeek;
            for (let i = 0; i < repeatCount; ++i) {
                datesToBeUpdated.push(
                    startDateLoop
                        .clone()
                        .add(NumberOfDaysPerWeek * i, 'day')
                        .toDate(),
                );
            }

            if (body.dayType === DayTypes.WORKING_DAY) {
                const data: IConfigDateData = {
                    updatedBy: new ObjectId(req.loginUser?._id),
                    workingDayTypeId: new ObjectId(body.workingDayTypeId),
                    dayType: body.dayType,
                };
                if (datesToBeUpdated.length > 1) {
                    data.linkKey = uuidv4();
                }
                await this.calendarConfigService.setWorkingDays(
                    datesToBeUpdated,
                    calendar._id,
                    data,
                );
            } else {
                await this.calendarConfigService.setNoneWorkingDays(
                    datesToBeUpdated,
                    calendar._id,
                    new ObjectId(req.loginUser?._id),
                );
            }
            return new SuccessResponse({
                datesToBeUpdated,
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':calendarId/config')
    async getCalendarConfig(
        @Req() req,
        @Param('calendarId', ParseObjectIdPipe) calendarId: ObjectId,
        @Query(
            new RemoveEmptyQueryPipe(),
            new JoiValidationPipe(GetCalendarConfigSchema),
        )
        query: IGetCalendarConfigStringQuery,
    ) {
        try {
            const calendar = await this.calendarService.getCalendarById(
                calendarId,
            );
            if (!calendar) {
                const message = await this.i18n.translate(
                    'calendar.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const configs = await this.calendarConfigService.getCalendarConfigs(
                {
                    startDate: moment
                        .tz(query.startDate, 'UTC')
                        .fmFullTimeString(),
                    endDate: moment.tz(query.endDate, 'UTC').fmFullTimeString(),
                    calendarId,
                },
            );
            return new SuccessResponse(configs);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':calendarId/config/:calendarConfigId')
    async getCalendarConfigById(
        @Req() req,
        @Param('calendarId', ParseObjectIdPipe) calendarId: ObjectId,
        @Param('calendarConfigId', ParseObjectIdPipe)
        calendarConfigId: ObjectId,
    ) {
        try {
            const calendar = await this.calendarService.getCalendarById(
                calendarId,
            );
            if (!calendar) {
                const message = await this.i18n.translate(
                    'calendar.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const config =
                await this.calendarConfigService.getCalendarConfigById(
                    calendarConfigId,
                );
            if (!config) {
                const message = await this.i18n.translate(
                    'calendar.error.config.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(config);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post(':calendarId/set-default')
    async setDefaultCalendar(
        @Param('calendarId', ParseObjectIdPipe) calendarId: ObjectId,
    ) {
        try {
            const calendar = await this.calendarService.getCalendarById(
                calendarId,
                ['projectId'],
            );
            if (!calendar) {
                const message = await this.i18n.translate(
                    'calendar.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            await this.calendarService.updateDefaultCalendar(
                calendar._id,
                calendar.projectId,
            );
            return new SuccessResponse();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post(':calendarId/unset-default')
    async unsetDefaultCalendar(
        @Param('calendarId', ParseObjectIdPipe) calendarId: ObjectId,
    ) {
        try {
            const calendar = await this.calendarService.getCalendarById(
                calendarId,
                ['projectId'],
            );
            if (!calendar) {
                const message = await this.i18n.translate(
                    'calendar.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            await this.calendarService.unsetDefaultCalendar(calendar.projectId);
            return new SuccessResponse();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
