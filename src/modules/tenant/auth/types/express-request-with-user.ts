import { Request } from 'express';
import { PayloadType } from '../interface/payload-types';

export interface RequestWithUser extends Request {
  user: PayloadType;
}
