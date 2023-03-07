import { ObjectId } from 'mongodb';
import { AuditLogActions, AuditLogModules } from './audit-log.constant';

export interface IAuditLogCreateBody {
    module: AuditLogModules;
    action: AuditLogActions;
    targetObjectId: ObjectId;
    description: string;
    createdBy: ObjectId;
}
