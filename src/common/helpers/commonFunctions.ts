import momentTimezone from 'moment-timezone';
import { AccessModules, DateFormat, UserRoles } from '../constants';
import bcrypt from 'bcrypt';
import * as child from 'child_process';
import path from 'path';

import dotenv from 'dotenv';
import { IMongoKeywordCondition } from '../interfaces';

import camelCase from 'lodash/camelCase';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import mapKeys from 'lodash/mapKeys';
import cloneDeep from 'lodash/cloneDeep';
import fs from 'fs';
import shell from 'shelljs';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { IUserAccessModule } from 'src/modules/user/user.interface';
import { SecurityPermissions } from 'src/modules/security-profile/security-profile.constant';
import intersection from 'lodash/intersection';
import { User } from 'src/modules/user/mongo-schemas/user.schema';

dotenv.config();

const DEFAULT_TIMEZONE_NAME = process.env.TIMEZONE_DEFAULT_NAME;

export function extractToken(authorization = '') {
    if (/^Bearer /.test(authorization)) {
        return authorization.substring(7, authorization.length);
    }
    return '';
}

export function convertTimeToUTC(time: string | Date) {
    return momentTimezone.tz(time, 'UTC').toDate();
}

export function isEndOfDay(
    dateTime: string | Date,
    tzName = DEFAULT_TIMEZONE_NAME,
) {
    const time = momentTimezone
        .tz(convertTimeToUTC(dateTime), tzName)
        .format(DateFormat.HH_mm_ss_COLON);
    return /23:59:59/.test(time);
}

export function isStartOfDay(
    dateTime: string | Date,
    tzName = DEFAULT_TIMEZONE_NAME,
) {
    const time = momentTimezone
        .tz(convertTimeToUTC(dateTime), tzName)
        .format(DateFormat.HH_mm_ss_COLON);
    return /00:00:00/.test(time);
}

/**
 * usecase: convert value of $select operator to value of $project operator in mongodb
 * example: ['_id', 'name'] => {
 *      _id: 1,
 *      name: 1,
 * }
 * @param attributeList attributes list select from mongo collection
 * @returns attributes list in $project operation
 */
export const parseMongoProjection = (
    attributeList: string[],
): Record<string, number> => {
    let rs = {};
    attributeList.forEach((val) => {
        rs = {
            ...rs,
            [val]: 1,
        };
    });

    return rs;
};

export function getTotalSkipItem(page: number, limit: number) {
    return page > 0 ? (page - 1) * limit : 0;
}

/**
 *
 * @param fields in db will be searched
 * @param keyword will be matched
 * @param option of regex (default i: Case insensitivity to match upper and lower cases)
 * @returns conditions by an array which used in query ($or/$and)
 */
export function getMongoKeywordConditions(
    fields: string[],
    keyword = '',
    option = 'i',
): IMongoKeywordCondition {
    return {
        $or: [
            ...fields.map((field) => {
                return {
                    [field]: {
                        $regex: `.*${keyword}.*`,
                        $options: option,
                    },
                };
            }),
        ],
    };
}
export function parseToCamelCase(data: any) {
    const parsedData = cloneDeep(data);
    function parse(item: any) {
        mapKeys(item, function (value, key) {
            const keyInCamelCase = camelCase(key);
            if (keyInCamelCase !== key) {
                item[keyInCamelCase] = cloneDeep(item[key]);
                delete item[key];
            }
            if (isPlainObject(item[keyInCamelCase] as any)) {
                parse(item[keyInCamelCase]);
            }
            if (isArray(item[keyInCamelCase])) {
                item[keyInCamelCase].forEach((childItem: any) =>
                    parse(childItem),
                );
            }
        });
    }
    parse(parsedData);
    return parsedData;
}

export function hashPassword(password: string) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}

export async function createCSVFile(
    columns: string[],
    i18KeyColumns: string[],
    fullPath: string,
    fileName: string,
    data,
    i18Key: string,
    i18n: I18nRequestScopeService,
) {
    const fields = columns.map((field) =>
        i18n.translate(`${i18Key}.columns.${field}`),
    );
    let csvContent = `\uFEFF${fields.map((h) => h).join()}`;
    (data || []).forEach((item) => {
        const p = [];
        columns.forEach((field) => {
            const fieldData = item[field]
                ? item[field]
                : item[field] === 0
                ? 0
                : '';
            if (i18KeyColumns.includes(field)) {
                p.push(i18n.translate(`${i18Key}.fieldData.${fieldData}`));
            } else {
                p.push(fieldData);
            }
        });
        csvContent = `${csvContent}\n${p.join()}`;
    });

    if (!fs.existsSync(fullPath)) {
        shell.mkdir('-p', fullPath);
    }
    fs.writeFileSync(`${fullPath}/${fileName}`, csvContent);
}

export async function appendCSVFile(
    columns: string[],
    i18KeyColumns: string[],
    fullPath: string,
    fileName: string,
    data,
    i18Key: string,
    i18n: I18nRequestScopeService,
) {
    // open file
    // append data to this file
    let csvContent = '';
    (data || []).forEach((item) => {
        const p = [];
        columns.forEach((field) => {
            const fieldData = item[field]
                ? item[field]
                : item[field] === 0
                ? 0
                : '';
            if (i18KeyColumns.includes(field)) {
                p.push(i18n.translate(`${i18Key}.fieldData.${fieldData}`));
            } else {
                p.push(fieldData);
            }
        });
        csvContent = `${csvContent}\n${p.join()}`;
    });
    if (!fs.existsSync(fullPath)) {
        shell.mkdir('-p', fullPath);
    }
    fs.appendFileSync(`${fullPath}/${fileName}`, csvContent);
}

export function getFileOrFolderNameFromPath(filePath: string) {
    const fileNameSplited = filePath.split('/');
    return fileNameSplited[fileNameSplited.length - 1];
}

export function toBase64(filePath: string) {
    return fs.readFileSync(filePath).toString('base64');
}

export function getAccessModules(
    accessModules: IUserAccessModule[],
    role: UserRoles,
): AccessModules[] {
    return accessModules
        .filter((userAccessModule) => userAccessModule.roles.includes(role))
        .map((userAccessModule) => userAccessModule.module);
}

export function hasSecurityPermissions(
    loginUser: User,
    requiredPermissions: SecurityPermissions[],
) {
    const adminAccessModule = getAccessModules(
        loginUser.accessModules,
        UserRoles.ADMIN,
    );
    if (adminAccessModule.includes(AccessModules.SPACIALYTIC_CONSTELLATION)) {
        return true;
    }
    return intersection(loginUser.permissions, requiredPermissions).length > 0;
}

export function runBashScriptSync(command: string) {
    return new Promise((resolve, reject) => {
        child.exec(
            command,
            {
                cwd: path.resolve('./'),
            },
            (error, stdout) => {
                if (!error) {
                    resolve(stdout);
                } else {
                    reject(error);
                }
            },
        );
    });
}
