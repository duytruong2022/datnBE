import env from 'dotenv';
import { UserStatus } from '../../src/common/constants';
import { hashPassword } from '../../src/common/helpers/commonFunctions';
env.config();
export const userData = {
    collectionName: 'users',
    data: [
        {
            deletedAt: null,
            deletedBy: null,
            updatedBy: null,
            createdAt: new Date(),
            email: 'admin@tokyotechlab.com',
            password: hashPassword('a123456789'),
            firstName: 'TTLab',
            lastName: 'Admin',
            phoneNumber: '0123456789',
            language: 'en',
            timezone: 'GMT+07:00',
            status: UserStatus.ACTIVE,
            accessModules: [
                {
                    module: 'spacialytic_platform',
                    roles: ['admin'],
                },
                {
                    module: 'spacialytic_3dwebviewer',
                    roles: ['admin', 'normal_user'],
                },
                {
                    module: 'spacialytic_constellation',
                    roles: ['admin'],
                },
            ],
        },
    ],
};
